-- Perintah SQL untuk membuat tabel penyimpanan jadwal permanen
CREATE TABLE schedule_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kegiatan VARCHAR(255) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);