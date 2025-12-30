require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 4000;
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes
const TREBLE_URL = process.env.TREBLE_URL || 'https://www.treblezine.com/the-100-best-songs-of-2025/';

app.use(cors());
app.use(express.json());

let cachedSongs = null;
let cacheTimestamp = 0;

// Genres/types from provided list
const TREBLE_METADATA = [
  { rank: 100, artist: 'Liquid Mike', title: '99', type: 'band', genre: 'Rock' },
  { rank: 99, artist: 'Makaya McCraven', title: 'Dark Parks', type: 'solo', genre: 'Jazz' },
  { rank: 98, artist: 'Honningbarna', title: 'Amor Fati', type: 'band', genre: 'Punk' },
  { rank: 97, artist: 'Pink Siifu', title: "LAST ONE ALIVE'!", type: 'solo', genre: 'Rap' },
  { rank: 96, artist: 'caroline', title: 'U R UR Only Aching', type: 'band', genre: 'Rock' },
  { rank: 95, artist: 'Ela Minus', title: 'Broken', type: 'solo', genre: 'Electronic' },
  { rank: 94, artist: 'Spellling', title: 'Drain', type: 'solo', genre: 'Rock' },
  { rank: 93, artist: 'Oklou', title: 'ict', type: 'solo', genre: 'Electronic' },
  { rank: 92, artist: 'Alex G', title: 'Afterlife', type: 'solo', genre: 'Folk' },
  { rank: 91, artist: 'Squid', title: 'Crispy Skin', type: 'band', genre: 'Rock' },
  { rank: 90, artist: 'Sofia Kourtesis & Daphni', title: 'Unidos', type: 'collab', genre: 'Electronic' },
  { rank: 89, artist: 'Sabrina Carpenter', title: 'Tears', type: 'solo', genre: 'Pop' },
  { rank: 88, artist: 'Richard Dawson', title: 'The Question', type: 'solo', genre: 'Folk' },
  { rank: 87, artist: 'Jay Som', title: 'Float', type: 'solo', genre: 'Rock', featuredArtists: ['Jim Adkins'] },
  { rank: 86, artist: 'Freddie Gibbs & The Alchemist', title: '1995', type: 'collab', genre: 'Rap' },
  { rank: 85, artist: 'Saya Gray', title: 'Lie Down..', type: 'solo', genre: 'Pop' },
  { rank: 84, artist: 'Playboi Carti', title: 'OPM BABI', type: 'solo', genre: 'Rap' },
  { rank: 83, artist: 'Danny Brown', title: 'Starburst', type: 'solo', genre: 'Rap' },
  { rank: 82, artist: 'Horsegirl', title: 'Julie', type: 'band', genre: 'Rock' },
  { rank: 81, artist: 'Scowl', title: 'Not Hell, Not Heaven', type: 'band', genre: 'Punk' },
  { rank: 80, artist: 'Ninajirachi', title: 'Infohazard', type: 'solo', genre: 'Electronic' },
  { rank: 79, artist: 'Aesop Rock', title: 'John Something', type: 'solo', genre: 'Rap' },
  { rank: 78, artist: 'Smerz', title: 'But I Do', type: 'duo', genre: 'Pop' },
  { rank: 77, artist: 'Momma', title: 'Ohio All the Time', type: 'band', genre: 'Rock' },
  { rank: 76, artist: 'Amaarae', title: 'Fineshyt', type: 'solo', genre: 'Pop' },
  { rank: 75, artist: 'Little Simz', title: 'Lion', type: 'solo', genre: 'Rap', featuredArtists: ['Obongjayar'] },
  { rank: 74, artist: 'Ethel Cain', title: 'Janie', type: 'solo', genre: 'Folk' },
  { rank: 73, artist: 'yeule', title: 'Evangelic Girl Is a Gun', type: 'solo', genre: 'Pop' },
  { rank: 72, artist: 'SML', title: 'Taking Out the Trash', type: 'band', genre: 'Jazz' },
  { rank: 71, artist: 'Black Eyes', title: 'TomTom', type: 'band', genre: 'Punk' },
  { rank: 70, artist: 'Bad Bunny', title: 'Baile Inolvidable', type: 'solo', genre: 'Pop' },
  { rank: 69, artist: 'Rochelle Jordan', title: 'Never Enough', type: 'solo', genre: 'Electronic' },
  { rank: 68, artist: 'Djrum', title: 'A Tune for Us', type: 'solo', genre: 'Electronic' },
  { rank: 67, artist: 'Ólafur Arnalds and Talos', title: 'Signs', type: 'collab', genre: 'Pop' },
  { rank: 66, artist: 'Gelli Haha', title: 'Spit', type: 'solo', genre: 'Pop' },
  { rank: 65, artist: 'Nation of Language', title: 'In Another Life', type: 'band', genre: 'Pop' },
  { rank: 64, artist: 'HUNTR/X', title: 'Golden', type: 'collab', genre: 'Pop' },
  { rank: 63, artist: 'FACS', title: 'Desire Path', type: 'band', genre: 'Rock' },
  { rank: 62, artist: 'Tunde Adebimpe', title: 'Ate the Moon', type: 'solo', genre: 'Rock' },
  { rank: 61, artist: 'McKinley Dixon', title: 'Run, Run, Run Pt. II', type: 'solo', genre: 'Rap' },
  { rank: 60, artist: 'Backxwash', title: 'Wake Up', type: 'solo', genre: 'Rap' },
  { rank: 59, artist: 'Motorbike', title: 'Cold Sweat', type: 'band', genre: 'Punk' },
  { rank: 58, artist: 'ShrapKnel', title: 'Alphabet Pho', type: 'duo', genre: 'Rap', featuredArtists: ['doseone'] },
  { rank: 57, artist: 'bar italia', title: 'Cowbella', type: 'band', genre: 'Rock' },
  { rank: 56, artist: 'Wet Leg', title: 'Pokemon', type: 'band', genre: 'Rock' },
  { rank: 55, artist: 'La Dispute', title: 'Man With Hands and Ankles Bound', type: 'band', genre: 'Rock' },
  { rank: 54, artist: 'Barker', title: 'Fluid Mechanics', type: 'solo', genre: 'Electronic' },
  { rank: 53, artist: 'Jeff Tweedy', title: 'Enough', type: 'solo', genre: 'Rock' },
  { rank: 52, artist: 'Margo Price', title: "Don't Let the Bastards Get You Down", type: 'solo', genre: 'Country' },
  { rank: 51, artist: 'Black Country, New Road', title: 'Two Horses', type: 'band', genre: 'Rock' },
  { rank: 50, artist: 'Tyler Childers', title: 'Oneida', type: 'solo', genre: 'Country' },
  { rank: 49, artist: 'Dijon', title: 'Yamaha', type: 'solo', genre: 'R&B' },
  { rank: 48, artist: 'Lambrini Girls', title: 'Big Dick Energy', type: 'band', genre: 'Punk' },
  { rank: 47, artist: 'PinkPantheress', title: 'Tonight', type: 'solo', genre: 'Pop' },
  { rank: 46, artist: 'Destroyer', title: 'Bologna', type: 'band', genre: 'Rock', featuredArtists: ['Fiver'] },
  { rank: 45, artist: 'Hannah Frances', title: 'Falling From and Further', type: 'solo', genre: 'Folk' },
  { rank: 44, artist: 'Boldy James and Real Bad Man', title: 'It Factor', type: 'collab', genre: 'Rap', featuredArtists: ['El-P'] },
  { rank: 43, artist: 'Jason Isbell', title: 'Gravelweed', type: 'solo', genre: 'Folk' },
  { rank: 42, artist: 'Open Mike Eagle', title: "ok but i'm the phone screen", type: 'solo', genre: 'Rap' },
  { rank: 41, artist: 'The Callous Daoboys', title: 'Distracted by the Mona Lisa', type: 'band', genre: 'Metal' },
  { rank: 40, artist: 'Messa', title: 'The Dress', type: 'band', genre: 'Metal' },
  { rank: 39, artist: "Preservation & Gabe 'Nandez", title: 'Mondo Cane', type: 'collab', genre: 'Rap', featuredArtists: ['Armand Hammer', 'Benjamin Booker'] },
  { rank: 38, artist: 'Guerilla Toss', title: 'Panglossian Mannequin', type: 'band', genre: 'Rock' },
  { rank: 37, artist: 'The Armed', title: 'Sharp Teeth', type: 'band', genre: 'Rock' },
  { rank: 36, artist: 'Tyler, the Creator', title: "Don't Tap That Glass/Tweakin'", type: 'solo', genre: 'Rap' },
  { rank: 35, artist: 'Baths', title: 'Eden', type: 'solo', genre: 'Electronic' },
  { rank: 34, artist: 'Fontaines D.C.', title: "It's Amazing to Be Young", type: 'band', genre: 'Rock' },
  { rank: 33, artist: 'Lifeguard', title: "Like You'll Lose", type: 'band', genre: 'Punk' },
  { rank: 32, artist: 'Eli Winter', title: 'Arabian Nightingale', type: 'solo', genre: 'Experimental' },
  { rank: 31, artist: 'Deftones', title: 'milk of the madonna', type: 'band', genre: 'Metal' },
  { rank: 30, artist: 'Annahstasia', title: 'Villain', type: 'solo', genre: 'Folk' },
  { rank: 29, artist: 'Armand Hammer & The Alchemist', title: 'Peshawar', type: 'collab', genre: 'Rap' },
  { rank: 28, artist: 'Jim Ghedi', title: 'What Will Become of England', type: 'solo', genre: 'Folk' },
  { rank: 27, artist: 'Ratboys', title: 'Light Night Mountains All That', type: 'band', genre: 'Rock' },
  { rank: 26, artist: 'Nourished by Time', title: 'BABY BABY', type: 'solo', genre: 'Pop' },
  { rank: 25, artist: 'Deafheaven', title: 'Winona', type: 'band', genre: 'Metal' },
  { rank: 24, artist: 'Tortoise', title: 'Oganesson', type: 'band', genre: 'Rock' },
  { rank: 23, artist: 'The Beths', title: 'No Joy', type: 'band', genre: 'Pop' },
  { rank: 22, artist: 'No Joy', title: 'Bits', type: 'band', genre: 'Rock' },
  { rank: 21, artist: 'Lady Gaga', title: 'Abracadabra', type: 'solo', genre: 'Pop' },
  { rank: 20, artist: 'Chat Pile & Hayden Pedigo', title: 'The Matador', type: 'collab', genre: 'Metal' },
  { rank: 19, artist: 'Panda Bear', title: 'Praise', type: 'solo', genre: 'Pop' },
  { rank: 18, artist: 'Agriculture', title: 'Bodhidharma', type: 'band', genre: 'Metal' },
  { rank: 17, artist: 'Stereolab', title: 'Melodie Is a Wound', type: 'band', genre: 'Pop' },
  { rank: 16, artist: 'Cate Le Bon', title: 'Heaven Is No Feeling', type: 'solo', genre: 'Pop' },
  { rank: 15, artist: 'Earl Sweatshirt', title: 'exhaust', type: 'solo', genre: 'Rap' },
  { rank: 14, artist: 'Clipse', title: 'Chains & Whips', type: 'duo', genre: 'Rap', featuredArtists: ['Kendrick Lamar'] },
  { rank: 13, artist: 'Turnstile', title: 'Never Enough', type: 'band', genre: 'Punk' },
  { rank: 12, artist: 'Dry Cleaning', title: 'Hit My Head All Day', type: 'band', genre: 'Rock' },
  { rank: 11, artist: 'Burial', title: 'Comafields', type: 'solo', genre: 'Electronic' },
  { rank: 10, artist: 'Nine Inch Nails', title: 'As Alive As You Need Me to Be', type: 'band', genre: 'Electronic' },
  { rank: 9, artist: 'Lucrecia Dalt', title: 'cosa rara', type: 'solo', genre: 'Experimental', featuredArtists: ['David Sylvian'] },
  { rank: 8, artist: 'Sudan Archives', title: 'My Type', type: 'solo', genre: 'Pop' },
  { rank: 7, artist: 'Geese', title: 'Long Island City Here I Come', type: 'band', genre: 'Rock' },
  { rank: 6, artist: 'Circuit des Yeux', title: 'Canopy of Eden', type: 'solo', genre: 'Pop' },
  { rank: 5, artist: 'billy woods', title: 'Corinthians', type: 'solo', genre: 'Rap', featuredArtists: ['Despot'] },
  { rank: 4, artist: 'Greet Death', title: 'Country Girl', type: 'band', genre: 'Rock' },
  { rank: 3, artist: 'FKA twigs', title: 'Girl Feels Good', type: 'solo', genre: 'Pop' },
  { rank: 2, artist: 'Model/Actriz', title: 'Cinderella', type: 'band', genre: 'Rock' },
  { rank: 1, artist: 'Wednesday', title: 'Townies', type: 'band', genre: 'Rock' },
];

const TREBLE_GENRE_OVERRIDES = TREBLE_METADATA.reduce((acc, item) => {
  if (item.genre) acc[item.rank] = item.genre;
  return acc;
}, {});

function buildMockSongs() {
  const songs = [];
  for (let i = 1; i <= 100; i += 1) {
    songs.push({
      id: `mock-${i}`,
      rank: i,
      title: `Top ${i} Track`,
      artist: `Artist ${i}`,
      featuredArtists: [],
      type: i % 2 === 0 ? 'band' : 'solo',
      genre: 'Rock',
      album: `Album ${Math.ceil(i / 10)}`,
      year: 2025,
      duration: 180 + (i % 45),
      coverUrl: `https://picsum.photos/seed/top100-${i}/300/300`,
      previewUrl: '',
      description: `Mock song ${i}`,
      source: 'mock-data',
    });
  }
  return songs;
}

async function fetchTrebleSongs() {
  try {
    const response = await axios.get(TREBLE_URL, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const items = [];

    const pickImageUrl = (imgEl) => {
      if (!imgEl || imgEl.length === 0) return '';
      const attrs = [
        imgEl.attr('data-src'),
        imgEl.attr('data-src-webp'),
        imgEl.attr('data-srcset'),
        imgEl.attr('data-srcset-webp'),
        imgEl.attr('src'),
      ].filter(Boolean);
      if (!attrs.length) return '';
      const first = attrs[0];
      if (first.includes(' ')) {
        return first.split(' ')[0];
      }
      return first;
    };

    $('h2.wp-block-heading').each((_, el) => {
      const raw = $(el).text().trim();
      if (!raw) return;
      const cleaned = raw.replace(/[“”]/g, '"').replace(/\u2013|\u2014/g, '-');
      const match = cleaned.match(/^(\d+)\.\s*(.+?)\s*-\s*"?(.+?)"?$/);
      if (!match) return;
      const rank = Number(match[1]);
      let artist = match[2].trim();
      let title = match[3].trim();

      const featMatch = title.match(/\(feat\.?\s*(.+?)\)/i);
      const featuredArtists = featMatch ? featMatch[1].split(/,|&/).map((f) => f.trim()).filter(Boolean) : [];
      title = title.replace(/\(feat\.?.*?\)/i, '').trim();

      let img =
        $(el).prevAll().find('img').first() ||
        $(el).prevAll('img').first();
      if (!img || img.length === 0) {
        img = $(el).nextAll().find('img').first();
      }
      const coverUrl = pickImageUrl(img);

      const meta = TREBLE_METADATA.find((m) => m.rank === rank) || {};
      if (meta.artist) artist = meta.artist;
      if (meta.title) title = meta.title;
      const mergedFeatured = featuredArtists.length ? featuredArtists : meta.featuredArtists || [];
      const genre = TREBLE_GENRE_OVERRIDES[rank] || meta.genre || 'unknown';

      let blurb = '';
      const nextP = $(el).nextAll('p').first();
      if (nextP && nextP.text()) {
        blurb = nextP.text().trim().replace(/\s+/g, ' ');
      }

      items.push({
        id: `treble-${rank}`,
        rank,
        title,
        artist,
        featuredArtists: mergedFeatured,
        type: meta.type || 'solo',
        genre,
        album: '',
        year: 2025,
        duration: undefined,
        coverUrl,
        previewUrl: '',
        description: blurb || raw,
        source: TREBLE_URL,
      });
    });

    if (items.length) {
      return items.sort((a, b) => a.rank - b.rank);
    }
    return null;
  } catch (err) {
    console.warn('Treble scrape failed:', err.message);
    return null;
  }
}

async function loadSongs() {
  const isCacheValid = cachedSongs && Date.now() - cacheTimestamp < CACHE_TTL_MS;
  if (isCacheValid) return cachedSongs;

  let songs = null;
  try {
    songs = await fetchTrebleSongs();
  } catch (err) {
    console.warn('External data fetch failed, falling back to mock data:', err.message);
  }

  if (!songs || songs.length === 0) {
    songs = buildMockSongs();
  }

  cachedSongs = songs;
  cacheTimestamp = Date.now();
  return songs;
}

function applyFilters(songs, query) {
  const searchTerm = query.search ? query.search.toLowerCase() : '';
  const genreFilter = query.genre ? query.genre.toLowerCase() : '';
  const artistFilter = query.artist ? query.artist.toLowerCase() : '';
  const typeFilter = query.type ? query.type.toLowerCase() : '';

  return songs.filter((song) => {
    if (genreFilter && song.genre.toLowerCase() !== genreFilter) return false;
    if (typeFilter && song.type && song.type.toLowerCase() !== typeFilter) return false;
    if (artistFilter) {
      const hasArtist =
        song.artist.toLowerCase().includes(artistFilter) ||
        (song.featuredArtists || []).some((feat) => feat.toLowerCase().includes(artistFilter));
      if (!hasArtist) return false;
    }
    if (searchTerm) {
      const inText =
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm) ||
        (song.album && song.album.toLowerCase().includes(searchTerm));
      if (!inText) return false;
    }
    return true;
  });
}

function sortSongs(songs, sort = 'rank') {
  const sorted = [...songs];
  if (sort === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'artist') {
    sorted.sort((a, b) => a.artist.localeCompare(b.artist));
  } else {
    sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  }
  return sorted;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cached: !!cachedSongs, lastUpdated: cacheTimestamp || null });
});

app.get('/api/songs', async (req, res) => {
  try {
    const songs = await loadSongs();
    const filtered = applyFilters(songs, req.query);
    const sorted = sortSongs(filtered, req.query.sort);
    const limit = req.query.limit ? Number(req.query.limit) : sorted.length;
    res.json({ count: sorted.length, items: sorted.slice(0, limit) });
  } catch (err) {
    console.error('Error in /api/songs', err);
    res.status(500).json({ error: 'Failed to load songs' });
  }
});

app.get('/api/songs/:id', async (req, res) => {
  try {
    const songs = await loadSongs();
    const song = songs.find((s) => s.id === req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (err) {
    console.error('Error in /api/songs/:id', err);
    res.status(500).json({ error: 'Failed to load song' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
