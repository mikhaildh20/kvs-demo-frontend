const normalizeOptionalText = (value) => {
    const text = String(value ?? "").trim();
    return text ? text : null;
};

const getKanbanErrorMessage = (error, fallback = "Kanban gagal disimpan") => {
    const message = String(error?.message || error || "").trim();
    const lowerMessage = message.toLowerCase();

    if (
        lowerMessage.includes("kbn_uniq_no") ||
        lowerMessage.includes("uq_kbn_uniq_no") ||
        (lowerMessage.includes("unique constraint") && lowerMessage.includes("uniq"))
    ) {
        return "Gagal karena Job No sudah digunakan. Kosongkan atau isi dengan nomor lain.";
    }

    if (
        lowerMessage.includes("kbn_no") ||
        lowerMessage.includes("kanban number is required") ||
        lowerMessage.includes("invalid kanban number")
    ) {
        return "Gagal karena Kanban No wajib diisi atau sudah tidak valid.";
    }

    if (lowerMessage.includes("no response from server")) {
        return "Gagal karena server tidak merespons. Cek koneksi atau API.";
    }

    if (lowerMessage.includes("upload") || lowerMessage.includes("file")) {
        return "Gagal karena file tidak bisa diupload. Cek ukuran atau format file.";
    }

    if (lowerMessage.includes("voice")) {
        return "Gagal karena voice tidak bisa dibuat. Cek deskripsi atau layanan voice.";
    }

    return message && message.length <= 120 ? `Gagal karena ${message}` : fallback;
};

export { getKanbanErrorMessage, normalizeOptionalText };
