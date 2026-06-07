package cafework.service.impl;

import cafework.dto.SeatStatusUpdateRequest;
import cafework.dto.SeatStatusUpdateResponse;
import cafework.dto.request.CafeRequest;
import cafework.model.Cafe;
import cafework.model.CafeTranslation;
import cafework.model.SearchHistory;
import cafework.model.User;
import cafework.repository.CafeRepository;
import cafework.repository.CafeTranslationRepository;
import cafework.repository.SearchHistoryRepository;
import cafework.repository.UserRepository;
import cafework.service.CafeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CafeServiceImpl implements CafeService {

    private static final List<String> VALID_SEAT_STATUSES = Arrays.asList(
            "AVAILABLE", "ALMOST_FULL", "FULL");
    private static final List<String> SUPPORTED_LANGS = Arrays.asList("VI", "EN", "JP");
    private static final int MAX_TRANSLATION_CANDIDATES = 50;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private CafeTranslationRepository cafeTranslationRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public List<Cafe> searchByName(String keyword) {
        return searchByName(keyword, "VI");
    }

    @Override
    public List<Cafe> searchByName(String keyword, String lang) {
        saveSearchHistory(keyword);

        String targetLang = normalizeLang(lang);
        String normalizedKeyword = normalizeForSearch(keyword);
        List<Cafe> cafes = cafeRepository.findAll();
        localizeCafes(cafes, targetLang);

        if (normalizedKeyword.isEmpty()) {
            return cafes;
        }

        String translatedKeyword = targetLang.equals("VI")
                ? ""
                : normalizeForSearch(translateTextSafely(keyword, targetLang, "VI"));

        List<Cafe> matched = cafes.stream()
                .filter(cafe -> matchesCafe(cafe, normalizedKeyword, translatedKeyword))
                .sorted(Comparator.comparing(Cafe::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return deduplicateById(matched);
    }

    @Override
    public Cafe getCafeDetailsById(UUID id) {
        return getCafeDetailsById(id, "VI");
    }

    @Override
    public Cafe getCafeDetailsById(UUID id, String lang) {
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe != null) {
            localizeCafe(cafe, normalizeLang(lang));
        }
        return cafe;
    }

    @Override
    public SeatStatusUpdateResponse updateSeatStatus(UUID cafeId, SeatStatusUpdateRequest request) {
        String newStatus = request.getSeatStatus();
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("seatStatus is required.");
        }
        if (!VALID_SEAT_STATUSES.contains(newStatus.toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "Invalid seatStatus: [" + newStatus + "]. Accepted values: AVAILABLE, ALMOST_FULL, FULL.");
        }

        Optional<Cafe> cafeOptional = cafeRepository.findById(cafeId);
        if (cafeOptional.isEmpty()) {
            return null;
        }

        Cafe cafe = cafeOptional.get();
        cafe.setSeatStatus(newStatus.toUpperCase(Locale.ROOT));
        cafeRepository.save(cafe);

        return new SeatStatusUpdateResponse(
                cafe.getId().toString(),
                cafe.getName(),
                cafe.getSeatStatus(),
                "Seat status updated successfully.");
    }

    @Override
    public Cafe getCafeByOwnerId(UUID ownerId) {
        return cafeRepository.findByOwnerId(ownerId).orElse(null);
    }

    @Override
    public Cafe updateCafe(UUID ownerId, CafeRequest request) {
        validateCafeRequest(request);

        Cafe cafe = cafeRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Cafe not found for this owner."));

        cafe.setName(request.getName());
        cafe.setOwnerName(request.getOwnerName());
        cafe.setEmail(request.getEmail());
        cafe.setPhone(request.getPhone());
        cafe.setOpenHours(request.getOpenHours());
        cafe.setAddress(request.getAddress());
        cafe.setLatitude(request.getLatitude());
        cafe.setLongitude(request.getLongitude());
        cafe.setDescription(request.getDescription());

        return cafeRepository.save(cafe);
    }

    @Override
    public Cafe createCafe(UUID ownerId, CafeRequest request) {
        validateCafeRequest(request);

        Cafe cafe = new Cafe();
        cafe.setId(UUID.randomUUID());
        cafe.setOwnerId(ownerId);
        cafe.setName(request.getName());
        cafe.setOwnerName(request.getOwnerName());
        cafe.setEmail(request.getEmail());
        cafe.setPhone(request.getPhone());
        cafe.setOpenHours(request.getOpenHours());
        cafe.setAddress(request.getAddress());
        cafe.setLatitude(request.getLatitude());
        cafe.setLongitude(request.getLongitude());
        cafe.setDescription(request.getDescription());

        return cafeRepository.save(cafe);
    }

    private void saveSearchHistory(String keyword) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return;
        }

        try {
            String email = auth.getName();
            Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
            if (userOpt.isPresent()) {
                SearchHistory history = new SearchHistory();
                history.setUserId(userOpt.get().getId().toString());
                history.setKeyword(keyword);
                searchHistoryRepository.save(history);
            }
        } catch (Exception e) {
            System.err.println("Failed to save search history: " + e.getMessage());
        }
    }

    private void localizeCafes(List<Cafe> cafes, String targetLang) {
        cafes.stream()
                .limit(MAX_TRANSLATION_CANDIDATES)
                .forEach(cafe -> localizeCafe(cafe, targetLang));
    }

    private void localizeCafe(Cafe cafe, String targetLang) {
        if (cafe == null || targetLang.equals("VI")) {
            clearLocalizedFields(cafe);
            return;
        }

        try {
            CafeTranslation translation = getOrCreateTranslation(cafe, targetLang);
            cafe.setLocalizedName(nonBlankOrNull(translation.getName()));
            cafe.setLocalizedAddress(nonBlankOrNull(translation.getAddress()));
            cafe.setLocalizedDescription(nonBlankOrNull(translation.getDescription()));
        } catch (Exception e) {
            System.err.println("Cafe translation fallback for " + cafe.getId() + ": " + e.getMessage());
            clearLocalizedFields(cafe);
        }
    }

    private CafeTranslation getOrCreateTranslation(Cafe cafe, String targetLang) {
        String sourceHash = sourceHash(cafe);
        Optional<CafeTranslation> existing = cafeTranslationRepository.findByCafeIdAndLang(cafe.getId(), targetLang);

        if (existing.isPresent() && sourceHash.equals(existing.get().getSourceHash())) {
            return existing.get();
        }

        CafeTranslation translation = existing.orElseGet(CafeTranslation::new);
        translation.setCafeId(cafe.getId());
        translation.setLang(targetLang);
        translation.setName(translateTextSafely(cafe.getName(), detectLanguage(cafe.getName()), targetLang));
        translation.setAddress(translateTextSafely(cafe.getAddress(), detectLanguage(cafe.getAddress()), targetLang));
        translation.setDescription(translateTextSafely(cafe.getDescription(), detectLanguage(cafe.getDescription()), targetLang));
        translation.setSourceHash(sourceHash);
        translation.setUpdatedAt(LocalDateTime.now());
        return cafeTranslationRepository.save(translation);
    }

    private void clearLocalizedFields(Cafe cafe) {
        if (cafe == null) return;
        cafe.setLocalizedName(null);
        cafe.setLocalizedAddress(null);
        cafe.setLocalizedDescription(null);
    }

    private boolean matchesCafe(Cafe cafe, String normalizedKeyword, String translatedKeyword) {
        List<String> fields = Arrays.asList(
                cafe.getName(),
                cafe.getAddress(),
                cafe.getDescription(),
                cafe.getLocalizedName(),
                cafe.getLocalizedAddress(),
                cafe.getLocalizedDescription());

        return fields.stream().anyMatch(field -> containsNormalized(field, normalizedKeyword))
                || (!translatedKeyword.isEmpty()
                && fields.stream().anyMatch(field -> containsNormalized(field, translatedKeyword)));
    }

    private boolean containsNormalized(String text, String keyword) {
        return !keyword.isEmpty() && normalizeForSearch(text).contains(keyword);
    }

    private List<Cafe> deduplicateById(List<Cafe> cafes) {
        Map<UUID, Cafe> byId = new LinkedHashMap<>();
        for (Cafe cafe : cafes) {
            byId.putIfAbsent(cafe.getId(), cafe);
        }
        return new ArrayList<>(byId.values());
    }

    private String normalizeForSearch(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String translateTextSafely(String text, String sourceLang, String targetLang) {
        if (isBlank(text)) return text;
        String source = normalizeLang(sourceLang);
        String target = normalizeLang(targetLang);
        if (source.equals(target)) return text;

        try {
            String url = "https://api.mymemory.translated.net/get?q="
                    + URLEncoder.encode(text, StandardCharsets.UTF_8)
                    + "&langpair=" + toIsoLang(source) + "|" + toIsoLang(target);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null) return text;
            Object responseData = response.get("responseData");
            if (!(responseData instanceof Map<?, ?> data)) return text;
            Object translatedText = data.get("translatedText");
            return translatedText instanceof String translated && !translated.isBlank() ? translated : text;
        } catch (Exception e) {
            System.err.println("Translation request failed: " + e.getMessage());
            return text;
        }
    }

    private String detectLanguage(String text) {
        if (isBlank(text)) return "VI";
        if (Pattern.compile("[\\u3040-\\u30FF\\u4E00-\\u9FAF]").matcher(text).find()) {
            return "JP";
        }
        if (Pattern.compile("[àáạảãăằắặẳẵâầấậẩẫèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]",
                Pattern.CASE_INSENSITIVE).matcher(text).find()) {
            return "VI";
        }
        return "EN";
    }

    private String normalizeLang(String lang) {
        if (lang == null) return "VI";
        String normalized = lang.trim().toUpperCase(Locale.ROOT);
        return SUPPORTED_LANGS.contains(normalized) ? normalized : "VI";
    }

    private String toIsoLang(String lang) {
        return switch (normalizeLang(lang)) {
            case "JP" -> "ja";
            case "EN" -> "en";
            default -> "vi";
        };
    }

    private String sourceHash(Cafe cafe) {
        String source = String.join("|",
                cafe.getName() == null ? "" : cafe.getName(),
                cafe.getAddress() == null ? "" : cafe.getAddress(),
                cafe.getDescription() == null ? "" : cafe.getDescription());
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return Integer.toHexString(source.hashCode());
        }
    }

    private String nonBlankOrNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private void validateCafeRequest(CafeRequest request) {
        if (isBlank(request.getName())) throw new IllegalArgumentException("Cafe name is required.");
        if (isBlank(request.getOwnerName())) throw new IllegalArgumentException("Owner name is required.");
        if (isBlank(request.getEmail())) throw new IllegalArgumentException("Email is required.");
        if (isBlank(request.getPhone())) throw new IllegalArgumentException("Phone is required.");
        if (isBlank(request.getAddress())) throw new IllegalArgumentException("Address is required.");

        if (!Pattern.matches("^[A-Za-z0-9+_.-]+@(.+)$", request.getEmail())) {
            throw new IllegalArgumentException("Invalid email format.");
        }

        if (!Pattern.matches("^\\d+$", request.getPhone())) {
            throw new IllegalArgumentException("Phone number must contain digits only.");
        }

        if (request.getOpenHours() == null || !Pattern.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9] - ([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", request.getOpenHours().trim())) {
            throw new IllegalArgumentException("Invalid business hours format. Example: 08:00 - 22:00");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
}
