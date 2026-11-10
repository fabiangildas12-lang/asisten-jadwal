// CONFIGURATION (Ganti dengan API Key milikmu nanti)
const SUPABASE_URL = "https://URL_PROJECT_SUPABASE_ANDA.supabase.co";
const SUPABASE_KEY = "KEY_PUBLIC_SUPABASE_ANDA";
const GEMINI_API_KEY = "AQ.Ab8RN6Il1Qux4EYsK0Vo2J0FqZnen7PD7yGnxpDFA1Mp059RjA";

// Inisialisasi SDK Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Meminta AI Menyusun Jadwal & Menyimpan ke SQL
async function prosesDenganAI() {
  const input = document.getElementById('userInput').value;
  if (!input.trim()) return alert("Tuliskan kegiatanmu terlebih dahulu!");

  const btn = document.getElementById('btnSubmit');
  const loading = document.getElementById('loading');
  btn.disabled = true;
  loading.classList.remove('hidden');

  try {
    // Prompt instruksi untuk Gemini AI
    const promptAI = `Kamu adalah asisten pengatur jadwal. Ubah teks berikut menjadi jadwal harian yang realistis. Output HARUS berupa format JSON rapi tanpa teks tambahan, berbentuk array of object dengan key: "kegiatan", "jam_mulai" (format HH:MM), dan "jam_selesai" (format HH:MM). Teks kegiatan: "${input}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptAI }] }]
      })
    });

    const result = await response.json();
    const aiTextResponse = result.candidates[0].content.parts[0].text;
    
    // Membersihkan format teks dari AI agar menjadi JSON murni
    const cleanJsonText = aiTextResponse.replace(/```json|```/g, '').trim();
    const parsedSchedule = JSON.parse(cleanJsonText);

    // Simpan hasil susunan AI ke Database SQL Supabase
    const { error } = await supabaseClient
      .from('schedule_items')
      .insert(parsedSchedule);

    if (error) throw error;

    document.getElementById('userInput').value = '';
    await muatDataPermanen();

  } catch (err) {
    console.error("Detail Error:", err);
    alert("Gagal memproses dengan AI atau menyimpan ke database. Pastikan API Key sudah diisi!");
  } finally {
    btn.disabled = false;
    loading.classList.add('hidden');
  }
}

// 2. Mengambil Data Permanen dari Database SQL
async function muatDataPermanen() {
  const list = document.getElementById('scheduleList');
  
  const { data, error } = await supabaseClient
    .from('schedule_items')
    .select('*')
    .order('jam_mulai', { ascending: true });

  if (error || !data || data.length === 0) {
    list.innerHTML = `<li class="text-slate-500 text-center py-4 text-sm">Belum ada data tersimpan di SQL.</li>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <li class="flex items-center justify-between p-4 bg-slate-900 border border-slate-700/60 rounded-xl">
      <div class="flex items-center gap-3">
        <input type="checkbox" ${item.is_completed ? 'checked' : ''} onchange="toggleStatus('${item.id}', ${item.is_completed})" class="h-5 w-5 accent-indigo-500 rounded">
        <span class="${item.is_completed ? 'line-through text-slate-500' : 'text-slate-200'} font-medium">
          ${item.kegiatan}
        </span>
      </div>
      <span class="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono px-3 py-1 rounded-md">
        ⏱️ ${item.jam_mulai} - ${item.jam_selesai}
      </span>
    </li>
  `).join('');
}

// 3. Mengubah Status Selesai di Database SQL
async function toggleStatus(id, currentStatus) {
  await supabaseClient
    .from('schedule_items')
    .update({ is_completed: !currentStatus })
    .eq('id', id);
  
  muatDataPermanen();
}

// Muat data otomatis saat pertama kali dibuka
muatDataPermanen();
