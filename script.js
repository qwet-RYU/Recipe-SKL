// ============================================================
// SKL 2 - RECIPE FINDER
// Alur aplikasi:
// ambil data API -> simpan secara lokal -> render kartu
// -> search/filter -> lihat detail -> simpan favorit
// ============================================================

console.log('=== SKL 2 - RECIPE FINDER ===');

// Array utama untuk menyimpan semua resep hasil fetch API.
// Kita simpan di sini supaya tidak perlu memanggil API lagi
// setiap kali pengguna melakukan search atau filter.
const recipesDataLocal = [];

// Array favorit hanya menyimpan ID resep, bukan seluruh object resep.
let favorites = [];

// Status apakah pengguna sedang melihat halaman favorit saja.
let showFavoritesOnly = false;


// ------------------------------------------------------------
// MEMBACA FAVORIT DARI LOCALSTORAGE
// ------------------------------------------------------------
// LocalStorage hanya menyimpan string, jadi JSON.parse()
// dipakai untuk mengubah string menjadi array JavaScript.
try {
  const savedFavorites = JSON.parse(
    localStorage.getItem('favorites')
  );

  // Validasi: pastikan data yang dibaca benar-benar array.
  if (Array.isArray(savedFavorites)) {
    // Set digunakan untuk menghapus ID yang duplikat.
    // filter() memastikan hanya ID berupa bilangan bulat yang dipakai.
    favorites = [...new Set(
      savedFavorites.filter(id => Number.isInteger(id))
    )];
  }
} catch (error) {
  // Jika data LocalStorage rusak atau formatnya salah,
  // aplikasi tetap bisa berjalan dengan favorites kosong.
  console.error('Gagal membaca favorit:', error);
}


// ------------------------------------------------------------
// MENGAMBIL ELEMENT DOM
// ------------------------------------------------------------
// Tanda $ hanyalah kebiasaan penamaan untuk element DOM,
// bukan syntax khusus JavaScript.
const $favoriteCount = document.querySelector('#favorite-count');
const $favoriteButton = document.querySelector('#favorite-button');
const $cuisineFilter = document.querySelector('#cuisine-filter');
const $difficultyFilter = document.querySelector('#difficulty-filter');
const $searchForm = document.querySelector('#search-form');
const $searchInput = document.querySelector('#search-input');

const $recipeGrid = document.querySelector('#recipe-grid');
const $recipeCount = document.querySelector('#recipe-count');
const $sectionTitle = document.querySelector('#section-title');
const $loadingState = document.querySelector('#loading-state');
const $errorState = document.querySelector('#error-state');
const $emptyState = document.querySelector('#empty-state');
const $resetButton = document.querySelector('#reset-filter-button');

const $recipeDialog = document.querySelector('#recipe-dialog');
const $dialogContent = document.querySelector('#dialog-content');
const $closeDialog = document.querySelector('#close-dialog');


// Mengubah teks judul aplikasi melalui JavaScript.
document.querySelector('.eyebrow').textContent =
  '🔥 RECIPE FINDER APP';

document.querySelector('h1').textContent =
  'Find your favorite recipe all over the world';


// ------------------------------------------------------------
// KEAMANAN TEKS
// ------------------------------------------------------------
// escapeHtml() mengubah karakter khusus seperti <, >, dan "
// menjadi HTML entity. Tujuannya agar teks dari API tidak
// bisa disisipkan sebagai kode HTML berbahaya ke halaman.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}


// ------------------------------------------------------------
// MENGAMBIL DATA DARI API
// ------------------------------------------------------------
// async digunakan karena fetch membutuhkan waktu.
// await membuat kode menunggu hasil sebelum lanjut.
async function getRecipesApi() {
  // limit=0 artinya ambil seluruh resep yang tersedia.
  const response = await fetch(
    'https://dummyjson.com/recipes?limit=0'
  );

  // response.ok bernilai false jika status HTTP bukan 2xx,
  // misalnya 404 atau 500.
  if (!response.ok) {
    throw new Error(`Request gagal: ${response.status}`);
  }

  // Mengubah respons JSON menjadi object JavaScript.
  const data = await response.json();

  // Validasi sederhana agar aplikasi tidak error
  // jika struktur data dari API berubah.
  if (!Array.isArray(data.recipes)) {
    throw new Error('Format data resep tidak sesuai.');
  }

  // Mengembalikan array berisi seluruh resep.
  return data.recipes;
}


// ------------------------------------------------------------
// MENAMPILKAN RESEP MENJADI KARTU
// ------------------------------------------------------------
function renderRecipes(recipesData = []) {
  // Menampilkan jumlah resep dan jumlah favorit.
  $recipeCount.textContent = `${recipesData.length} recipes`;
  $favoriteCount.textContent = favorites.length;

  // Jika ada resep, sembunyikan empty state dan tampilkan grid.
  // Jika tidak ada resep, tampilkan empty state.
  $emptyState.hidden = recipesData.length !== 0;
  $recipeGrid.hidden = recipesData.length === 0;

  // Menampung HTML semua kartu sebelum dimasukkan ke grid.
  let recipeCardsHtml = '';

  // Loop setiap resep untuk membuat satu kartu.
  for (let i = 0; i < recipesData.length; i++) {
    const recipe = recipesData[i];

    // Memeriksa apakah resep ini sudah ada di daftar favorit.
    const isFavorite = favorites.includes(recipe.id);

    // Menghitung total waktu memasak.
    const totalCookTime =
      recipe.prepTimeMinutes + recipe.cookTimeMinutes;

    // Template literal dipakai untuk membuat HTML kartu.
    recipeCardsHtml += `
      <article class="recipe-card">
        <img
          class="recipe-image"
          src="${escapeHtml(recipe.image)}"
          alt="${escapeHtml(recipe.name)}"
          loading="lazy"
        >

        <div class="recipe-body">
          <span class="recipe-cuisine">
            ${escapeHtml(recipe.cuisine)}
          </span>

          <h3 class="recipe-title">
            ${escapeHtml(recipe.name)}
          </h3>

          <div class="recipe-meta">
            <span>⭐ ${recipe.rating}</span>
            <span>⏱ ${totalCookTime} min</span>
            <span>${escapeHtml(recipe.difficulty)}</span>
          </div>

          <div class="recipe-actions">
            <!-- ID resep dikirim ke fungsi detail -->
            <button
              type="button"
              class="detail-button"
              onclick="showRecipeDetail(${recipe.id})"
            >
              View Detail
            </button>

            <!-- Tombol favorit: hati penuh jika sudah favorit -->
            <button
              type="button"
              class="like-button"
              onclick="toggleFavorite(${recipe.id})"
              aria-pressed="${isFavorite}"
              aria-label="${
                isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'
              }"
              title="Favorite"
            >
              ${isFavorite ? '❤️' : '♡'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // innerHTML mengganti seluruh isi grid dengan kartu baru.
  // Karena itu, hasil search/filter akan menggantikan tampilan lama.
  $recipeGrid.innerHTML = recipeCardsHtml;
}


// ------------------------------------------------------------
// SEARCH, FILTER, DAN FAVORIT
// ------------------------------------------------------------
// Fungsi ini menggabungkan semua syarat tampil:
// nama, cuisine, difficulty, dan status favorit.
function applyFilters() {
  // Ambil nilai pencarian dari input.
  // toLowerCase() agar huruf besar/kecil tidak berpengaruh.
  // trim() menghapus spasi berlebih di awal dan akhir.
  const search = $searchInput.value.toLowerCase().trim();

  // Ambil nilai dropdown cuisine dan difficulty.
  const cuisine = $cuisineFilter.value;
  const difficulty = $difficultyFilter.value;

  // filter() membuat array baru berisi resep yang lolos syarat.
  let result = recipesDataLocal.filter(recipe => {
    // Nama resep harus mengandung teks pencarian.
    const matchesSearch =
      recipe.name.toLowerCase().includes(search);

    // Jika cuisine kosong, semua cuisine boleh lolos.
    // Jika dipilih, hanya cuisine yang sama yang lolos.
    const matchesCuisine =
      cuisine === '' || recipe.cuisine === cuisine;

    // Logika yang sama berlaku untuk difficulty.
    const matchesDifficulty =
      difficulty === '' || recipe.difficulty === difficulty;

    // Semua syarat harus benar karena memakai &&.
    return matchesSearch && matchesCuisine && matchesDifficulty;
  });

  // Jika tombol favorit aktif, tampilkan hanya resep favorit.
  if (showFavoritesOnly) {
    result = result.filter(recipe => favorites.includes(recipe.id));
  }

  // Mengubah judul section sesuai mode yang aktif.
  $sectionTitle.textContent = showFavoritesOnly
    ? 'Favorite Recipes'
    : 'Explore Recipes';

  // Memberi tahu screen reader apakah tombol favorit aktif.
  $favoriteButton.setAttribute(
    'aria-pressed',
    String(showFavoritesOnly)
  );

  // Tombol reset hanya muncul jika ada filter yang aktif.
  $resetButton.hidden = !(
    search || cuisine || difficulty || showFavoritesOnly
  );

  // Menampilkan hasil akhir ke halaman.
  renderRecipes(result);
}


// ------------------------------------------------------------
// MEMBUAT OPSI DROPDOWN CUISINE
// ------------------------------------------------------------
// Opsi cuisine dibuat otomatis dari data API,
// sehingga tidak perlu menulis manual di HTML.
function renderCuisineOptions(recipesData) {
  const cuisineList = recipesData
    // Ambil nilai cuisine dari setiap resep.
    .map(recipe => recipe.cuisine)
    // Hapus cuisine yang duplikat.
    .filter((item, index, arr) => arr.indexOf(item) === index)
    // Urutkan secara alfabetis.
    .sort();

  // Opsi pertama untuk menampilkan semua cuisine.
  let html = '<option value="">All Cuisine</option>';

  for (let i = 0; i < cuisineList.length; i++) {
    const cuisine = escapeHtml(cuisineList[i]);

    html += `<option value="${cuisine}">${cuisine}</option>`;
  }

  // Memasukkan seluruh opsi ke dropdown.
  $cuisineFilter.innerHTML = html;
}


// ------------------------------------------------------------
// MENAMBAH ATAU MENGHAPUS FAVORIT
// ------------------------------------------------------------
function toggleFavorite(recipeId) {
  // Cek apakah resep sudah menjadi favorit.
  const isFavorite = favorites.includes(recipeId);

  // Jika sudah favorit, hapus ID-nya dengan filter().
  // Jika belum, tambahkan ID-nya menggunakan spread operator.
  const nextFavorites = isFavorite
    ? favorites.filter(id => id !== recipeId)
    : [...favorites, recipeId];

  try {
    // LocalStorage hanya menerima string,
    // jadi array harus diubah dengan JSON.stringify().
    localStorage.setItem(
      'favorites',
      JSON.stringify(nextFavorites)
    );
  } catch (error) {
    // Misalnya storage browser diblokir atau penuh.
    console.error('Gagal menyimpan favorit:', error);
    alert('Favorit gagal disimpan. Periksa pengaturan penyimpanan browser.');
    return;
  }

  // Simpan array baru sebagai favorit aktif.
  favorites = nextFavorites;

  // Perbarui tampilan kartu dan jumlah favorit.
  applyFilters();
}


// ------------------------------------------------------------
// MENAMPILKAN DETAIL RESEP
// ------------------------------------------------------------
function showRecipeDetail(recipeId) {
  // find() mencari satu resep berdasarkan ID.
  const recipe = recipesDataLocal.find(
    recipe => recipe.id === recipeId
  );

  // Jika resep tidak ditemukan, hentikan fungsi
  // agar tidak error saat mengakses properti recipe.
  if (!recipe) {
    return;
  }

  // Mengubah array ingredients menjadi list HTML.
  const ingredientsHtml = recipe.ingredients
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join('');

  // Mengubah array instructions menjadi paragraf bernomor.
  const instructionsHtml = recipe.instructions
    .map((step, index) => `
      <p>${index + 1}. ${escapeHtml(step)}</p>
    `)
    .join('');

  // Mengisi isi dialog dengan data resep yang dipilih.
  $dialogContent.innerHTML = `
    <img
      class="dialog-image"
      src="${escapeHtml(recipe.image)}"
      alt="${escapeHtml(recipe.name)}"
    >

    <div class="dialog-body">
      <span class="recipe-cuisine">
        ${escapeHtml(recipe.cuisine)}
      </span>

      <h2 id="recipe-dialog-title">
        ${escapeHtml(recipe.name)}
      </h2>

      <div class="dialog-meta">
        <span>⭐ ${recipe.rating}</span>
        <span>${escapeHtml(recipe.difficulty)}</span>
        <span>Persiapan: ${recipe.prepTimeMinutes} min</span>
        <span>Memasak: ${recipe.cookTimeMinutes} min</span>
        <span>Porsi: ${recipe.servings}</span>
      </div>

      <h3>Ingredients</h3>
      <ul class="ingredients">${ingredientsHtml}</ul>

      <h3>Instructions</h3>
      <div class="instructions">${instructionsHtml}</div>
    </div>
  `;

  // Menghubungkan judul dialog untuk aksesibilitas.
  $recipeDialog.setAttribute(
    'aria-labelledby',
    'recipe-dialog-title'
  );

  // showModal() membuka element <dialog>.
  $recipeDialog.showModal();
}


// ------------------------------------------------------------
// EVENT LISTENER
// ------------------------------------------------------------
// Event listener dipasang satu kali saat halaman dimuat.

// Search dijalankan ketika form disubmit.
// preventDefault() mencegah halaman reload.
$searchForm.addEventListener('submit', function (event) {
  event.preventDefault();
  applyFilters();
});

// Tombol favorit mengubah mode:
// semua resep <-> hanya resep favorit.
$favoriteButton.addEventListener('click', function () {
  showFavoritesOnly = !showFavoritesOnly;
  applyFilters();
});

// Reset mengembalikan semua filter ke kondisi awal.
$resetButton.addEventListener('click', function () {
  $searchForm.reset();
  $cuisineFilter.value = '';
  $difficultyFilter.value = '';
  showFavoritesOnly = false;

  applyFilters();
});

// Menutup dialog detail.
$closeDialog.addEventListener('click', function () {
  $recipeDialog.close();
});


// ------------------------------------------------------------
// MENJALANKAN APLIKASI
// ------------------------------------------------------------
async function main() {
  // Tampilkan jumlah favorit yang dibaca dari LocalStorage.
  $favoriteCount.textContent = favorites.length;

  // Tampilkan loading dan sembunyikan status lain.
  $loadingState.hidden = false;
  $errorState.hidden = true;
  $emptyState.hidden = true;
  $recipeGrid.hidden = true;

  try {
    // Ambil seluruh resep dari API.
    const recipesData = await getRecipesApi();

    // Kosongkan array lokal sebelum mengisi ulang.
    recipesDataLocal.length = 0;

    // Spread operator memasukkan seluruh item array
    // satu per satu ke recipesDataLocal.
    recipesDataLocal.push(...recipesData);

    // Buat opsi dropdown cuisine dari data API.
    renderCuisineOptions(recipesData);

    // Tampilkan resep sesuai filter awal.
    applyFilters();
  } catch (error) {
    // Jika API gagal, tampilkan error state.
    console.error('Gagal memuat resep:', error);

    $recipeGrid.hidden = true;
    $emptyState.hidden = true;
    $errorState.hidden = false;
    $recipeCount.textContent = 'Gagal memuat resep';
  } finally {
    // finally selalu dijalankan,
    // baik berhasil maupun gagal.
    $loadingState.hidden = true;
  }
}

// Titik awal aplikasi.
main();