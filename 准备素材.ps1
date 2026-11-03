$ErrorActionPreference = 'Stop'
$assetRoot = Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Force -Path "$assetRoot/provinces", "$PSScriptRoot/vendor" | Out-Null
$files = @{
 'china.json' = 'https://raw.githubusercontent.com/zhChuXiao/ChinaGeoJson/master/china.json'
 'geo-license.txt' = 'https://raw.githubusercontent.com/zhChuXiao/ChinaGeoJson/master/LICENSE'
 'land.geojson' = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'
 'earth.jpg' = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_atmos_2048.jpg'
 'clouds.png' = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/earth_clouds_1024.png'
 'moon.jpg' = 'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/textures/planets/moon_1024.jpg'
}
foreach ($file in $files.GetEnumerator()) {
 $dest = Join-Path $assetRoot $file.Key
 if (!(Test-Path -LiteralPath $dest)) { Invoke-WebRequest $file.Value -OutFile $dest; Write-Output $file.Key }
}
if (!(Test-Path "$PSScriptRoot/vendor/three.module.js")) {
 Invoke-WebRequest 'https://unpkg.com/three@0.170.0/build/three.module.js' -OutFile "$PSScriptRoot/vendor/three.module.js"
 Invoke-WebRequest 'https://unpkg.com/three@0.170.0/LICENSE' -OutFile "$PSScriptRoot/vendor/THREE-LICENSE.txt"
}
$entries = Invoke-RestMethod 'https://api.github.com/repos/zhChuXiao/ChinaGeoJson/contents/province'
foreach ($entry in $entries) {
 if ($entry.name.EndsWith('.json')) {
  $dest = Join-Path "$assetRoot/provinces" $entry.name
  if (!(Test-Path -LiteralPath $dest)) { Invoke-WebRequest $entry.download_url -OutFile $dest }
 }
}
Write-Output 'Geography and textures are ready.'
