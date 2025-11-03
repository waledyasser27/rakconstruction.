# Optimize and generate responsive image variants (JPG + WEBP)
# Sizes: 800, 1200, 1920 (downscale only)
# Requirements: ImageMagick (magick)

$ErrorActionPreference = 'Stop'

# Check ImageMagick
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
  Write-Error 'ImageMagick (magick) is not installed or not in PATH. Install from https://imagemagick.org' 
  exit 1
}

# Images to process (relative to project root)
$images = @(
  'medical/juffali_medical_center.jpg',
  'educational/king_abdelaziz_engineering_building.jpg',
  'commercial/10botiquemall.jpg',
  'residential/privatevilla6.jpg',
  'hospitality/hayathotel.jpg',
  'industrial/ford_showroom_workshop.jpg',
  'medical/mekkah_diyalsis_center_kella.jpg',
  'commercial/polivard.jpg',
  'industrial/mercedes.jpg',
  'commercial/randaofficebuilding.jpg',
  'industrial/redeseagatewaywarehouse.jpg',
  'residential/privatevilla1.jpg'
)

# Target sizes (downscale only using '>')
$targets = @(
  @{Suffix='-800';  Size='800>'},
  @{Suffix='-1200'; Size='1200>'},
  @{Suffix='-1920'; Size='1920>'}
)

$quality = 82

foreach ($rel in $images) {
  $full = Join-Path $PSScriptRoot "..\$rel"
  if (-not (Test-Path $full)) { Write-Warning "Missing: $rel"; continue }

  $dir  = Split-Path $full -Parent
  $base = [System.IO.Path]::GetFileNameWithoutExtension($full)

  foreach ($t in $targets) {
    $jpgOut  = Join-Path $dir ("$base$($t.Suffix).jpg")
    $webpOut = Join-Path $dir ("$base$($t.Suffix).webp")

    # JPG
    magick convert "$full" -auto-orient -strip -filter Lanczos -resize $($t.Size) -quality $quality "$jpgOut"
    # WEBP
    magick convert "$full" -auto-orient -strip -filter Lanczos -resize $($t.Size) -quality $quality "$webpOut"

    Write-Host "Generated: $jpgOut" -ForegroundColor Yellow
    Write-Host "Generated: $webpOut" -ForegroundColor Yellow
  }
}

Write-Host "Done generating responsive variants." -ForegroundColor Green
