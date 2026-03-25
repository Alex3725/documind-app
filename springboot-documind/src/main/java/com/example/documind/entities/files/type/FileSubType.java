package com.example.documind.entities.files.type;

public enum FileSubType {

    // 📄 DOCUMENT
    TEXT,
    PDF,
    WORD,
    SPREADSHEET,
    PRESENTATION,
    RICH_TEXT,
    MARKDOWN,
    XML_DOC,

    // 🖼️ MEDIA
    IMAGE_RASTER,
    IMAGE_VECTOR,
    AUDIO_LOSSY,
    AUDIO_LOSSLESS,
    VIDEO_COMPRESSED,
    VIDEO_RAW,

    // 📦 ARCHIVE
    ZIP,
    TAR,
    GZIP,
    BZIP2,
    XZ,
    SEVEN_Z,
    RAR,
    ISO_ARCHIVE,

    // 💻 CODE
    SOURCE_CODE,
    SCRIPT_SHELL,
    SCRIPT_GENERAL,
    CONFIG_JSON,
    CONFIG_YAML,
    CONFIG_TOML,
    CONFIG_INI,

    // ⚙️ EXECUTABLE
    EXECUTABLE_BINARY,
    SHARED_LIBRARY,
    BYTECODE,

    // 🧪 DATA
    DATABASE_SQL,
    DATABASE_NOSQL,
    DATA_JSON,
    DATA_XML,
    DATA_CSV,
    DATA_PARQUET,
    DATA_BINARY,

    // 🖥️ SYSTEM
    LOG,
    TEMP,
    CACHE,
    LOCK_FILE,

    // 🔐 SECURITY
    ENCRYPTED_FILE,
    PRIVATE_KEY,
    PUBLIC_KEY,
    CERTIFICATE,

    // 📦 OTHER
    FONT,
    EBOOK,
    DISK_IMAGE,
    TORRENT,
    UNKNOWN
}

