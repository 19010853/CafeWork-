CREATE TABLE IF NOT EXISTS cafe_translations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cafe_id uuid NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
    lang varchar(8) NOT NULL,
    name varchar(255),
    address varchar(255),
    description text,
    source_hash varchar(64) NOT NULL,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cafe_translations_cafe_lang UNIQUE (cafe_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_cafe_translations_lang
ON cafe_translations (lang);

CREATE INDEX IF NOT EXISTS idx_cafe_translations_cafe_id_lang
ON cafe_translations (cafe_id, lang);
