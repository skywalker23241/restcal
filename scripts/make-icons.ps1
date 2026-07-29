# 生成 PWA 图标：基于 favicon 的「休」字设计渲染 PNG。
# 用法：pwsh scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\public\assets\icons"
New-Item -ItemType Directory -Force $outDir | Out-Null

$bg = [System.Drawing.Color]::FromArgb(0xB4, 0x38, 0x2A)
$fg = [System.Drawing.Color]::FromArgb(0xFD, 0xF3, 0xEE)
$borderColor = [System.Drawing.Color]::FromArgb([int](255 * 0.45), 0xFD, 0xF3, 0xEE)

function New-RoundedRectPath([System.Drawing.RectangleF]$rect, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-Icon([int]$size, [string]$file, [bool]$fullBleed, [float]$glyphScale) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.TextRenderingHint = "AntiAliasGridFit"

    $bgBrush = New-Object System.Drawing.SolidBrush($bg)
    if ($fullBleed) {
        # maskable / apple-touch：纯色铺满，系统自行裁切圆角
        $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    } else {
        $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
        $path = New-RoundedRectPath $rect ($size * 14 / 64)
        $g.FillPath($bgBrush, $path)
        $path.Dispose()
    }

    # 内描边，对应 SVG 里的半透明白色细框
    $inset = $size * 4 / 64
    $borderRect = New-Object System.Drawing.RectangleF($inset, $inset, ($size - 2 * $inset), ($size - 2 * $inset))
    $borderPath = New-RoundedRectPath $borderRect ($size * 10 / 64)
    $pen = New-Object System.Drawing.Pen($borderColor, ($size * 2.5 / 64))
    $g.DrawPath($pen, $borderPath)
    $pen.Dispose(); $borderPath.Dispose()

    $font = New-Object System.Drawing.Font("SimSun", ($size * $glyphScale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = "Center"
    $fmt.LineAlignment = "Center"
    $fgBrush = New-Object System.Drawing.SolidBrush($fg)
    $textRect = New-Object System.Drawing.RectangleF(0, ($size * 0.02), $size, $size)
    $g.DrawString("休", $font, $fgBrush, $textRect, $fmt)

    $font.Dispose(); $fgBrush.Dispose(); $bgBrush.Dispose(); $fmt.Dispose(); $g.Dispose()
    $bmp.Save((Join-Path $outDir $file), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "✓ public/assets/icons/$file"
}

New-Icon 192 "icon-192.png" $false 0.60
New-Icon 512 "icon-512.png" $false 0.60
New-Icon 512 "maskable-512.png" $true 0.46   # maskable 需要安全区，字形缩小
New-Icon 180 "apple-touch-icon.png" $true 0.60
