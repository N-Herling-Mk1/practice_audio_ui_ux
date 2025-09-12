# Function to install a Windows Capability and show progress
function Install-Capability {
    param (
        [string]$CapabilityName
    )

    Write-Host "Starting installation of $CapabilityName ..." -ForegroundColor Cyan

    try {
        $result = Add-WindowsCapability -Online -Name $CapabilityName -ErrorAction Stop

        if ($result.State -eq 'Installed') {
            Write-Host "✅ Successfully installed $CapabilityName" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ Installation of $CapabilityName completed with state: $($result.State)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Failed to install $CapabilityName" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

# Main script
Write-Host "=== Installing English (UK) language pack and TextToSpeech voices ===" -ForegroundColor Magenta

Install-Capability -CapabilityName "Language.Basic~~~en-GB~0.0.1.0"
Install-Capability -CapabilityName "Language.TextToSpeech~~~en-GB~0.0.1.0"

Write-Host "`nInstallation script finished." -ForegroundColor Magenta
Write-Host "Please reboot your PC for changes to take effect." -ForegroundColor Yellow
