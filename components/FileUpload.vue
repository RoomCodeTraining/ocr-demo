<template>
  <div class="file-upload-container">
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
        accept=".pdf,.doc,.docx,.txt"
        style="display: none;"
      />

      <div v-if="!isUploading" class="upload-content">
        <div class="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <h3>Glissez-déposez votre fichier ici</h3>
        <p>ou cliquez pour sélectionner un fichier</p>
        <p class="file-types">Formats supportés: PDF, DOC, DOCX, TXT</p>
      </div>

      <div v-else class="uploading-content">
        <div class="spinner"></div>
        <h3>Extraction en cours...</h3>
        <p>{{ uploadProgress }}</p>
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
        <button @click="removeFile" class="remove-btn">×</button>
      </div>
    </div>

    <div v-if="extractionResult" class="extraction-result">
      <h3>Résultats de l'extraction</h3>
      <div class="result-tabs">
        <button
          v-for="tab in resultTabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="{ active: activeTab === tab.key }"
          class="tab-btn">
          {{ tab.label }}
        </button>
      </div>

      <div class="result-content">
        <div v-if="activeTab === 'text'" class="text-content">
          <h4>Texte extrait</h4>
          <div class="text-preview">{{ normalizedText || 'Aucun texte extrait' }}</div>
        </div>

        <div v-if="activeTab === 'links'" class="links-content">
          <h4>Liens trouvés</h4>
          <div v-if="extractionResult.links && extractionResult.links.length > 0" class="links-list">
            <a v-for="(link, index) in extractionResult.links"
               :key="index"
               :href="link"
               target="_blank"
               class="link-item">
              {{ link }}
            </a>
          </div>
          <div v-else class="no-links">Aucun lien trouvé</div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { normalizeTextForStorage } from '../lib/utils'

// Reactive state
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref('')
const extractionResult = ref(null)
const error = ref('')
const activeTab = ref('text')

// Computed
const resultTabs = computed(() => [
  { key: 'text', label: 'Texte' },
  { key: 'links', label: 'Liens' }
])

const normalizedText = computed(() => {
  if (!extractionResult.value) return ''
  const raw =
    (extractionResult.value.extracted_info && (extractionResult.value.extracted_info.text || extractionResult.value.extracted_info.content)) ||
    extractionResult.value.text ||
    extractionResult.value.content ||
    ''
  return normalizeTextForStorage(raw)
})

// Methods
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value.click()
  }
}

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
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Type de fichier non supporté. Veuillez sélectionner un fichier PDF, DOC, DOCX ou TXT.'
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
    formData.append('include_text', 'true')
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
</script>

<style scoped>
.file-upload-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.upload-area {
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f7fafc;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.upload-area.drag-over {
  border-color: #4299e1;
  background: #ebf8ff;
  transform: scale(1.02);
}

.upload-area.uploading {
  border-color: #38a169;
  background: #f0fff4;
  cursor: not-allowed;
}

.upload-content {
  color: #4a5568;
}

.upload-icon {
  color: #a0aec0;
  margin-bottom: 16px;
}

.upload-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.upload-content p {
  margin: 4px 0;
  color: #718096;
}

.file-types {
  font-size: 0.875rem;
  color: #a0aec0;
}

.uploading-content {
  color: #38a169;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #38a169;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.selected-file {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  color: #4299e1;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
}

.file-name {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #2d3748;
}

.file-size {
  margin: 0;
  font-size: 0.875rem;
  color: #718096;
}

.remove-btn {
  background: #fed7d7;
  color: #c53030;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background: #feb2b2;
}

.extraction-result {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.extraction-result h3 {
  margin: 0 0 16px 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.result-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  color: #718096;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #4299e1;
}

.tab-btn.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.result-content h4 {
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 1.125rem;
}

.text-preview {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item {
  color: #4299e1;
  text-decoration: none;
  padding: 8px 12px;
  background: #ebf8ff;
  border-radius: 6px;
  border: 1px solid #bee3f8;
  transition: all 0.2s ease;
  word-break: break-all;
}

.link-item:hover {
  background: #bee3f8;
  text-decoration: underline;
}

.no-links {
  color: #718096;
  font-style: italic;
  padding: 16px;
  text-align: center;
}

.error-message {
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #c53030;
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-message p {
  margin: 0;
  font-weight: 500;
}

@media (max-width: 640px) {
  .file-upload-container {
    padding: 16px;
  }

  .upload-area {
    padding: 40px 16px;
  }

  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .result-tabs {
    flex-direction: column;
  }

  .tab-btn {
    text-align: left;
  }
}
</style>
