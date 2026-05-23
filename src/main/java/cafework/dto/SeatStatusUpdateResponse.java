package cafework.dto;

public class SeatStatusUpdateResponse {

    private String cafeId;
    private String cafeName;
    private String seatStatus;
    private String message;

    public SeatStatusUpdateResponse() {
    }

    public SeatStatusUpdateResponse(String cafeId, String cafeName, String seatStatus, String message) {
        this.cafeId = cafeId;
        this.cafeName = cafeName;
        this.seatStatus = seatStatus;
        this.message = message;
    }

    public String getCafeId() {
        return cafeId;
    }

    public void setCafeId(String cafeId) {
        this.cafeId = cafeId;
    }

    public String getCafeName() {
        return cafeName;
    }

    public void setCafeName(String cafeName) {
        this.cafeName = cafeName;
    }

    public String getSeatStatus() {
        return seatStatus;
    }

    public void setSeatStatus(String seatStatus) {
        this.seatStatus = seatStatus;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}