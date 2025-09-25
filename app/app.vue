<template>
  <div class="app-container">
    <NuxtRouteAnnouncer />

    <!-- Minimal Header (optional controls) -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <div class="logo-text">
            <h1>OCR LinkedIn Demo</h1>
            <p>Mise en avant de mes compétences (Nuxt 3, Vue, TS, Tailwind)</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="toggleTheme" class="theme-toggle elevated" :aria-pressed="isDark">
            <svg v-if="!isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            {{ isDark ? 'Clair' : 'Sombre' }}
          </button>
          <button @click="clearAll" class="clear-btn elevated" :disabled="!selectedFile && !extractionResult">Effacer</button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <!-- Minimal Content: Upload + Preview -->
      <section class="dashboard" style="margin-bottom: 0;">
        <div class="catalog-header" style="margin: 0 0 1rem 0;">
          <h2>OCR</h2>
        </div>
      </section>

      <div class="content-grid">
        <!-- Upload Form -->
        <div class="upload-panel elevated" v-show="showForm">
          <div class="panel-header">
            <h2>📁 Téléchargement de fichier</h2>
            <p>Sélectionnez un document pour extraire son contenu</p>
          </div>

          <div class="upload-form">
            <div class="upload-area"
                 :class="{ 'drag-over': isDragOver, 'uploading': isUploading }"
                 @drop="handleDrop"
                 @dragover="handleDragOver"
                 @dragleave="handleDragLeave"
                 @click="triggerFileInput">

              <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                accept=".pdf"
                style="display: none;"
              />

              <div v-if="!isUploading" class="upload-content">
                <div class="upload-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <h3>Glissez-déposez votre fichier</h3>
                <p>ou <span class="click-here">cliquez ici</span> pour parcourir</p>
                <div class="supported-formats">
                  <div class="format-item">
                    <span class="format-icon">📄</span>
                    <span>PDF uniquement</span>
                  </div>
                </div>
              </div>

              <div v-else class="uploading-content">
                <div class="spinner"></div>
                <h3>Extraction en cours...</h3>
                <p>{{ uploadProgress }}</p>
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
              </div>
            </div>

            <div v-if="selectedFile" class="selected-file">
              <div class="file-info">
                <div class="file-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <div class="file-details">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button @click="removeFile" class="remove-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="error" class="error-message">
              <div class="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <p>{{ error }}</p>
            </div>
          </div>
        </div>
        <!-- Results Preview -->
        <div class="upload-panel results-panel elevated" v-if="extractionResult">
          <div class="results-content">
            <div class="success-message" v-if="getSuccessMessage()">
              <div class="success-icon">✅</div>
              <p>{{ getSuccessMessage() }}</p>
        </div>

            <div class="result-tabs">
              <button
                v-for="tab in resultTabs"
                :key="tab.key"
                class="tab-btn"
                :class="{ active: activeTab === tab.key }"
                @click="activeTab = tab.key">
                <span class="tab-icon">{{ tab.icon }}</span>
                {{ tab.label }}
              </button>
            </div>

            <div class="results-content">
              <div v-if="activeTab === 'text'">
                <div class="content-header">
                  <h4>Texte extrait</h4>
                  <div class="actions-inline" v-if="getNormalizedExtractedText()">
                    <input class="search-input inline" v-model="extractSearch" placeholder="Rechercher dans le texte..." />
                    <span class="count-badge" v-if="extractSearch">{{ matchCount }}</span>
                    <button class="copy-btn" @click="copyToClipboard(getNormalizedExtractedText())">Copier</button>
                  </div>
                </div>
                <div class="text-preview" v-if="getNormalizedExtractedText()" v-html="getHighlightedHtml"></div>
                <div class="text-preview" v-else>Aucun texte extrait</div>
              </div>

              <div v-if="activeTab === 'links'">
                <div class="content-header">
                  <h4>Liens trouvés</h4>
                  <span class="count-badge" v-if="(getExtractedLinks() || []).length">{{ (getExtractedLinks() || []).length }}</span>
                </div>
                <div v-if="getExtractedLinks() && getExtractedLinks().length" class="links-list">
                  <a v-for="(link, idx) in getExtractedLinks()" :key="idx" :href="link" target="_blank" class="link-item">
                    <span class="link-icon">🔗</span>
                    <span class="link-text">{{ link }}</span>
                    <span class="link-arrow">↗</span>
                  </a>
                </div>
                <div v-else class="no-links">Aucun lien trouvé</div>
              </div>

              <div v-if="activeTab === 'metadata'">
                <div class="content-header">
                  <h4>Métadonnées</h4>
                </div>
                <div class="metadata-preview"><pre>{{ JSON.stringify(getApiMetadata(), null, 2) }}</pre></div>
              </div>

              <div v-if="activeTab === 'insights'">
                <div class="content-header">
                  <h4>Insights</h4>
                </div>
                <div class="insights-grid">
                  <div class="insight-card">
                    <h5>Mots-clés fréquents</h5>
                    <ul class="keywords">
                      <li v-for="([word, count], idx) in keywords" :key="idx">
                        <span class="kw">{{ word }}</span>
                        <span class="kw-count">{{ count }}</span>
                      </li>
                    </ul>
                  </div>
                  <div class="insight-card">
                    <h5>Champs lexicaux détectés</h5>
                    <ul class="fields">
                      <li v-for="(fs, idx) in fieldScores" :key="idx">
                        <span class="field">{{ fs.field }}</span>
                        <span class="field-score">{{ fs.score }}</span>
                      </li>
                      <li v-if="!fieldScores.length" class="muted">Aucun champ détecté</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive state
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref('')
const extractionResult = ref(null)
const error = ref('')
const activeTab = ref('text')
const extractSearch = ref('')
const showForm = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedSubCategory = ref('')
const isDark = ref(false)
// removed demo decisions data for a minimal OCR demo

// Computed
const resultTabs = computed(() => [
  { key: 'text', label: 'Texte', icon: '📝' },
  { key: 'links', label: 'Liens', icon: '🔗' },
  { key: 'metadata', label: 'Métadonnées', icon: '⚙️' },
  { key: 'insights', label: 'Insights', icon: '💡' }
])

// removed decisions and categories computed properties

// Methods
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value.click()
  }
}

// removed clearFilters (no filters in minimal demo)

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const processFile = async (file) => {
  // Validate file type - PDF only
  const allowedTypes = ['application/pdf']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Type de fichier non supporté. Veuillez sélectionner un fichier PDF uniquement.'
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Le fichier est trop volumineux. Taille maximale: 10MB'
    return
  }

  selectedFile.value = file
  error.value = ''
  await uploadAndExtract(file)
}

const uploadAndExtract = async (file) => {
  isUploading.value = true
  uploadProgress.value = 'Préparation du fichier...'

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('force_ocr', 'true')
    formData.append('include_links', 'true')

    uploadProgress.value = 'Envoi vers le serveur...'

    const response = await fetch('https://extract-text.roomcodetraining.com/extract', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    uploadProgress.value = 'Traitement des résultats...'

    const result = await response.json()
    extractionResult.value = result

    uploadProgress.value = 'Terminé!'

  } catch (err) {
    error.value = `Erreur lors de l'extraction: ${err.message}`
    console.error('Upload error:', err)
  } finally {
    isUploading.value = false
    uploadProgress.value = ''
  }
}

const removeFile = () => {
  selectedFile.value = null
  extractionResult.value = null
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Functions to extract data from API response
const getExtractedText = () => {
  if (!extractionResult.value) return null

  // Check for new API structure with combined_text
  if (extractionResult.value.combined_text) {
    return extractionResult.value.combined_text
  }

  // Check if response has the old structure with data.extracted_info
  if (extractionResult.value.data?.extracted_info?.text) {
    return extractionResult.value.data.extracted_info.text
  }

  // Fallback to other structures
  if (extractionResult.value.extracted_info?.text) {
    return extractionResult.value.extracted_info.text
  }
  if (extractionResult.value.extracted_info?.content) {
    return extractionResult.value.extracted_info.content
  }
  if (extractionResult.value.text) {
    return extractionResult.value.text
  }
  if (extractionResult.value.content) {
    return extractionResult.value.content
  }

  return null
}

const getExtractedLinks = () => {
  if (!extractionResult.value) return null

  // Check if response has the new structure with data.extracted_info
  if (extractionResult.value.data?.extracted_info?.links) {
    return extractionResult.value.data.extracted_info.links
  }

  // Fallback to old structure
  if (extractionResult.value.extracted_info?.links) {
    return extractionResult.value.extracted_info.links
  }
  if (extractionResult.value.extracted_info?.urls) {
    return extractionResult.value.extracted_info.urls
  }
  if (extractionResult.value.links) {
    return extractionResult.value.links
  }
  if (extractionResult.value.urls) {
    return extractionResult.value.urls
  }

  return null
}

const getApiMetadata = () => {
  if (!extractionResult.value) return null

  // Check if response has the new structure with data.api_metadata
  if (extractionResult.value.data?.api_metadata) {
    return extractionResult.value.data.api_metadata
  }

  // Check for new API structure - create metadata from available fields
  if (extractionResult.value.combined_text) {
    return {
      strategy: extractionResult.value.strategy,
      total_pages: extractionResult.value.total_pages,
      text_length: extractionResult.value.combined_text.length,
      extraction_timestamp: new Date().toISOString()
    }
  }

  // Fallback to old structure
  if (extractionResult.value.api_metadata) {
    return extractionResult.value.api_metadata
  }

  return null
}

const getSuccessMessage = () => {
  if (!extractionResult.value) return null

  // Check for explicit message
  if (extractionResult.value.message) {
    return extractionResult.value.message
  }

  // Generate success message based on extracted content
  if (extractionResult.value.combined_text) {
    const strategy = extractionResult.value.strategy || 'extraction'
    const totalPages = extractionResult.value.total_pages || 'N/A'
    return `Extraction réussie avec la stratégie ${strategy} (${totalPages} pages traitées)`
  }

  return null
}

// New functions
const clearAll = () => {
  selectedFile.value = null
  extractionResult.value = null
  error.value = ''
  activeTab.value = 'text'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
    console.log('Texte copié dans le presse-papiers')
  } catch (err) {
    console.error('Erreur lors de la copie:', err)
  }
}

const handleLogout = () => {
  // Placeholder: clear local data and redirect to homepage/login as needed
  decisions.value = []
  selectedFile.value = null
  extractionResult.value = null
  showForm.value = false
  error.value = ''
}

// removed formatDate (unused)
// Override to normalize extracted text before usage/persistence
const originalGetExtractedText = getExtractedText
const getNormalizedExtractedText = () => {
  const raw = originalGetExtractedText()
  return raw ? raw.trim() : null
}

// Search & highlight helpers
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getHighlightedHtml = computed(() => {
  const text = getNormalizedExtractedText() || ''
  const query = extractSearch.value.trim()
  if (!query) {
    return escapeHtml(text).replace(/\n/g, '<br/>')
  }
  try {
    const pattern = new RegExp(escapeRegExp(query), 'gi')
    const escaped = escapeHtml(text)
    return escaped
      .replace(pattern, (m) => `<mark class=\"hl\">${m}</mark>`) // matched text is safe within escaped context
      .replace(/\n/g, '<br/>')
  } catch {
    return escapeHtml(text).replace(/\n/g, '<br/>')
  }
})

const matchCount = computed(() => {
  const text = getNormalizedExtractedText() || ''
  const q = extractSearch.value.trim()
  if (!q) return 0
  try {
    const pattern = new RegExp(escapeRegExp(q), 'gi')
    const matches = text.match(pattern)
    return matches ? matches.length : 0
  } catch {
    return 0
  }
})

// Insights (keywords & lexical fields)
const frenchStopwords = new Set([
  'alors','au','aucuns','aussi','autre','avant','avec','avoir','bon','car','ce','cela','ces','ceux','chaque','ci','comme','comment','dans','des','du','dedans','dehors','depuis','devrait','doit','donc','dos','droite','début','elle','elles','en','encore','essai','est','et','eu','fait','faites','fois','font','force','haut','hors','ici','il','ils','je','juste','la','le','les','leur','là','ma','maintenant','mais','mes','mine','moins','mon','mot','même','ni','nommés','notre','nous','nouveaux','ou','où','par','parce','parole','pas','personnes','peut','peu','pièce','plupart','pour','pourquoi','quand','que','quel','quelle','quelles','quels','qui','sa','sans','ses','seulement','si','sien','son','sont','sous','soyez','sujet','sur','ta','tandis','tellement','tels','tes','ton','tous','tout','trop','très','tu','valeur','voie','voient','vont','votre','vous','vu','ça','étaient','état','étions','été','être'
])

const tokenize = (text) => {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    .split(/[^a-zA-ZÀ-ÿ0-9]+/)
    .filter(w => w && w.length >= 3 && !frenchStopwords.has(w))
}

const keywords = computed(() => {
  const text = getNormalizedExtractedText() || ''
  const tokens = tokenize(text)
  const freq = new Map()
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1)
  return Array.from(freq.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, 25)
})

const lexicalFieldsMap = {
  juridique: ['tribunal','jugement','contrat','loi','justice','droit','procédure','décision','litige','avocat','preuve','condamnation','indemnisation','licenciement','bail','succession','franchise'],
  finance: ['montant','euros','amende','indemnité','coût','valeur','budget','facture','paiement'],
  travail: ['employeur','salarié','travail','licenciement','harcèlement','contrat'],
  famille: ['divorce','garde','enfant','pension','familiale'],
  immobilier: ['bail','loyer','locataire','expulsion','propriétaire','renouvellement'],
  assurance: ['assurance','indemnisation','sinistre','accident'],
  environnement: ['pollution','environnement','déchets','eau','sol','dépollution'],
  tech: ['informatique','maintenance','application','web','développement']
}

const fieldScores = computed(() => {
  const text = (getNormalizedExtractedText() || '').toLowerCase()
  const scores = []
  for (const [field, terms] of Object.entries(lexicalFieldsMap)) {
    let score = 0
    for (const term of terms) {
      const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi')
      const m = text.match(re)
      if (m) score += m.length
    }
    if (score > 0) scores.push({ field, score })
  }
  return scores.sort((a,b) => b.score - a.score)
})

const applyThemeClass = (dark) => {
  const root = document.documentElement
  if (dark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyThemeClass(isDark.value)
  try { localStorage.setItem('prefersDark', JSON.stringify(isDark.value)) } catch {}
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('prefersDark')
    isDark.value = saved ? JSON.parse(saved) : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    isDark.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyThemeClass(isDark.value)
  try { document.title = 'OCR LinkedIn Demo — Mise en avant de mes compétences' } catch {}
})

</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header Styles */
.app-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  color: #3b82f6;
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.logo-text p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: #e2e8f0;
  color: #475569;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Main Content */
.app-main {
  flex: 1;
  padding: 2rem 0;
}

.content-grid {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  min-height: calc(100vh - 200px);
}

/* Panel Styles */
.upload-panel {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.panel-header p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.upload-form {
  padding: 1.5rem;
}

/* Upload Area Styles */
.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-area:hover::before {
  opacity: 0.05;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1);
}

.upload-area.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: scale(1.02);
  box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.1);
}

.upload-area.uploading {
  border-color: #10b981;
  background: #f0fdf4;
  cursor: not-allowed;
}

.upload-content {
  color: #64748b;
  position: relative;
  z-index: 1;
}

.upload-icon {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  transition: color 0.3s ease;
}

.upload-area:hover .upload-icon {
  color: #3b82f6;
}

.upload-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.upload-content p {
  margin: 0.5rem 0;
  color: #64748b;
}

.click-here {
  color: #3b82f6;
  font-weight: 600;
  text-decoration: underline;
}

.supported-formats {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.format-icon {
  font-size: 1rem;
}

.uploading-content {
  color: #10b981;
  position: relative;
  z-index: 1;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes progress {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

/* Selected File Styles */
.selected-file {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  color: #3b82f6;
  flex-shrink: 0;
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 8px;
}

.file-details {
  flex: 1;
}

.file-name {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.file-size {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.remove-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* Error Message Styles */
.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #dc2626;
  margin-top: 1rem;
}

.error-icon {
  flex-shrink: 0;
  color: #dc2626;
}

.error-message p {
  margin: 0;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Results Panel Styles */
.results-panel {
  transition: all 0.3s ease;
}

.results-panel.has-content {
  border-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1);
}

.results-content {
  padding: 1.5rem;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #166534;
  margin-bottom: 1.5rem;
}

.success-icon {
  flex-shrink: 0;
  color: #10b981;
}

.success-message p {
  margin: 0;
  font-weight: 500;
  font-size: 0.875rem;
}

.result-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: #64748b;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  color: #3b82f6;
  background: #f1f5f9;
}

.tab-btn.active {
  color: #3b82f6;
  background: #eff6ff;
  border: 1px solid #dbeafe;
}

.tab-icon {
  font-size: 1rem;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.content-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.actions-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input.inline {
  width: 260px;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Content Styles */
.text-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
}

.text-preview mark.hl {
  background: #fff3c4;
  color: inherit;
  padding: 0 2px;
  border-radius: 3px;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #3b82f6;
  text-decoration: none;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 12px;
  border: 1px solid #dbeafe;
  transition: all 0.2s ease;
  word-break: break-all;
}

.link-item:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
}

.link-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.link-text {
  flex: 1;
  font-size: 0.875rem;
}

.link-arrow {
  font-size: 1rem;
  opacity: 0.6;
  flex-shrink: 0;
}

.no-links {
  padding: 2rem;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
}

.empty-state svg {
  color: #94a3b8;
}

.empty-state h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #475569;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

.metadata-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
}

.metadata-preview pre {
  margin: 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.insight-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.insight-card h5 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
}

.keywords, .fields {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.4rem;
}

.keywords li, .fields li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.kw, .field { font-weight: 600; color: #1e293b; }
.kw-count, .field-score { background: #eef2ff; color: #3730a3; padding: 0.125rem 0.5rem; border-radius: 9999px; font-weight: 700; font-size: 0.75rem; }
.muted { color: #64748b; font-style: italic; }

.text-area {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  resize: vertical;
}

/* Empty Results */
.empty-results {
  padding: 3rem 1.5rem;
  text-align: center;
}

.empty-results .empty-state {
  color: #64748b;
}

.empty-results .empty-state svg {
  color: #94a3b8;
}

.empty-results .empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
}

.empty-results .empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Dashboard */
.dashboard {
  max-width: 1400px;
  margin: 0 auto 1.5rem;
  padding: 0 2rem;
}

.catalog-header {
  max-width: 1400px;
  margin: 1rem auto 1rem;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpis-container {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.kpi {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.2s ease;
}

.kpi:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.kpi-label {
  color: #64748b;
  font-size: 0.825rem;
}

.kpi-value {
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filters-section {
  display: flex;
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  min-width: 160px;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.actions-section {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: 1px solid #2563eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: #2563eb;
}

.decisions-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.decision-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.decision-title {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.decision-meta {
  color: #64748b;
  font-size: 0.85rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.decision-meta::before {
  content: '📅';
  font-size: 0.8rem;
}

.decision-snippet {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.no-decisions {
  color: #64748b;
  font-style: italic;
  padding: 1rem 0;
}

/* Timeline */
.timeline {
  position: relative;
  margin: 2rem 0;
  padding-left: 2rem;
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  padding-left: 3rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: 0;
  bottom: -2rem;
  width: 2px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 1px;
}

.timeline-marker {
  position: absolute;
  left: -2rem;
  top: 0.5rem;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  z-index: 2;
}

.timeline-content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.timeline-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  width: min(900px, 92vw);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-close {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1rem 1.25rem 1.25rem 1.25rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .header-content {
    padding: 0 1rem;
  }

  .content-grid {
    padding: 0 1rem;
  }
}

@media (max-width: 768px) {
  .app-main {
    padding: 1rem 0;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .logo-section {
    align-self: center;
  }

  .header-actions {
    align-self: center;
  }

  .upload-area {
    padding: 2rem 1rem;
  }

  .supported-formats {
    gap: 0.5rem;
  }

  .format-item {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .result-tabs {
    flex-direction: column;
    gap: 0.25rem;
  }

  .tab-btn {
    justify-content: flex-start;
    text-align: left;
  }

  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .text-preview,
  .metadata-preview {
    max-height: 300px;
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 0.75rem;
  }

  .content-grid {
    padding: 0 0.75rem;
  }

  .panel-header,
  .upload-form,
  .results-content {
    padding: 1rem;
  }

  .upload-area {
    padding: 1.5rem 0.75rem;
  }

  .upload-content h3 {
    font-size: 1.125rem;
  }

  .supported-formats {
    flex-direction: column;
    align-items: center;
  }

  .format-item {
    width: 100%;
    justify-content: center;
  }
}

/* Document Container Styles */
.documents-container {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1rem;
}

.empty-documents {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
  color: #64748b;
}

.empty-state svg {
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: #6b7280;
}

.doc-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.doc-row {
  display: flex;
  gap: 0.75rem;
}

.doc-icon {
  color: #ef4444;
  background: #fef2f2;
  padding: 0.5rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.doc-main {
  min-width: 0;
}

.doc-title {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  color: #64748b;
  font-size: 0.8rem;
}

.doc-badges {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.pill {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.pill-danger {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fecaca;
}

.doc-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  color: #1e293b;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #ef4444;
  color: white;
  border-color: #dc2626;
}

.btn-primary:hover:not(:disabled) {
  background: #dc2626;
}

/* Dark theme overrides */
.dark body {
  background: #0b1220;
  color: #e5e7eb;
}

.dark .app-header {
  background: #0f172a;
  border-bottom-color: #1f2937;
  box-shadow: 0 1px 0 0 rgba(0,0,0,0.4);
}

.dark .logo-text h1 { color: #e5e7eb; }
.dark .logo-text p { color: #9ca3af; }
.dark .logo-icon { color: #60a5fa; background: #0b1a34; }

.dark .kpis-container,
.dark .documents-container,
.dark .upload-panel,
.dark .selected-file,
.dark .timeline-content,
.dark .extraction-result {
  background: #0f172a;
  border-color: #1f2937;
  box-shadow: none;
}

.dark .kpi { background: #0b1220; border-color: #1f2937; }
.dark .kpi-label { color: #94a3b8; }
.dark .kpi-value { color: #e5e7eb; }

.dark .search-input,
.dark .filter-select,
.dark .text-area,
.dark .text-preview,
.dark .metadata-preview {
  background: #0b1220;
  color: #e5e7eb;
  border-color: #1f2937;
}

.dark .clear-btn,
.dark .theme-toggle,
.dark .copy-btn {
  background: #0b1220;
  border-color: #1f2937;
  color: #94a3b8;
}
.dark .clear-btn:hover,
.dark .theme-toggle:hover,
.dark .copy-btn:hover { background: #111827; color: #e5e7eb; }

.dark .doc-card { background: #0f172a; border-color: #1f2937; }
.dark .doc-icon { background: #2a0e0e; color: #f87171; }
.dark .pill { background: #0b1220; color: #e5e7eb; border-color: #1f2937; }
.dark .pill-danger { background: #3b0a0a; color: #fecaca; border-color: #7f1d1d; }

.dark .link-item { background: #0b1220; border-color: #1f2937; color: #93c5fd; }
.dark .link-item:hover { background: #111827; border-color: #374151; }

.dark .upload-area { background: #0b1220; border-color: #1f2937; }
.dark .upload-area:hover { background: #0f172a; border-color: #2563eb; }
.dark .upload-icon { color: #64748b; }
.dark .click-here { color: #93c5fd; }

.dark .btn { background: #0b1220; border-color: #1f2937; color: #e5e7eb; }
.dark .btn:hover:not(:disabled) { background: #111827; }
.dark .btn-primary { background: #ef4444; border-color: #b91c1c; }
.dark .btn-primary:hover:not(:disabled) { background: #b91c1c; }

.dark .error-message { background: #3b0a0a; border-color: #7f1d1d; color: #fecaca; }
.dark .success-message { background: #052e1c; border-color: #065f46; color: #a7f3d0; }

/* Responsive Grid */
@media (max-width: 1280px) { /* xl */
  .documents-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) { /* lg */
  .documents-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) { /* md */
  .documents-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) { /* sm */
  .documents-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-select {
    min-width: auto;
  }

  .actions-section {
    justify-content: center;
  }
}
</style>
