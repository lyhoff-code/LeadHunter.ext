# Lead Hunter AI - Setup Guide

## Instalacion

### 1. Generar iconos PNG

Antes de instalar la extension, necesitas convertir el icono SVG a PNG:

**Opcion A - Online (mas facil):**
1. Ve a https://svgtopng.com/
2. Sube `icons/icon.svg`
3. Descarga en 16x16, 32x32, 48x48 y 128x128
4. Guardalos como `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` en la carpeta `icons/`

**Opcion B - Linea de comandos (si tienes ImageMagick):**
```bash
cd icons
./generate-icons.sh
```

### 2. Instalar extension en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa "Modo desarrollador" (esquina superior derecha)
3. Click en "Cargar extension sin empaquetar"
4. Selecciona la carpeta `LeadHunter.ext`

### 3. Configurar APIs

1. Click en el icono de Lead Hunter en la barra de Chrome
2. Ve a la pestana "Config"
3. Configura:

**Gemini API Key (GRATIS):**
- Ve a https://aistudio.google.com/apikey
- Crea una API key
- Pegala en el campo correspondiente

**HubSpot API Key (GRATIS):**
- Ve a https://app.hubspot.com/private-apps/
- Crea una Private App con permisos de Contacts
- Copia el token y pegalo

### 4. Configurar filtros

- Ajusta las keywords personalizadas segun tu nicho
- Selecciona las industrias objetivo
- Agrega competidores que quieres detectar

## Uso

1. Navega a cualquier plataforma soportada (LinkedIn, Facebook, etc.)
2. Scrollea normalmente - la extension escanea automaticamente
3. Leads detectados se resaltan con un badge de score
4. Click en el popup para ver todos los leads
5. Click en un lead para ver detalles, copiar mensaje, enviar a HubSpot

## Plataformas Soportadas

- LinkedIn
- Facebook
- Twitter/X
- Nextdoor
- Quora
- Google Reviews
- Yelp
- Alignable
- Thumbtack
- Houzz
- DentalTown
- HVAC-Talk
- ContractorTalk
- YouTube
- TikTok

## Limites de API (Plan Gratuito)

**Gemini 2.0 Flash:**
- 15 requests por minuto
- 1,500 requests por dia
- Suficiente para uso normal

**HubSpot:**
- Sin limite en creacion de contactos
- Private App gratuita

## Troubleshooting

**La extension no detecta nada:**
- Verifica que el escaneo este activo (no pausado)
- Revisa que tengas la API key de Gemini configurada
- Algunos sitios cargan contenido dinamicamente - scrollea para cargar mas

**Error de API:**
- Verifica que las API keys sean correctas
- Revisa los limites de requests

**Leads no se guardan en HubSpot:**
- Verifica el token de HubSpot
- Asegurate que la Private App tenga permisos de Contacts
