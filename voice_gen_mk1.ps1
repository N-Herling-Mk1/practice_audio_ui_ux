Add-Type -AssemblyName System.Speech

# Initialize the speech synthesizer
$Synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Output folder (change if needed)
$OutputFolder = "$PSScriptRoot\VoiceClips"
New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null

# Define phrases and corresponding filenames
$Phrases = @{
    "Welcome" = "welcome.wav"
    "Go to CV" = "go_to_cv.wav"
    "Go to Project 1 - Senior Design" = "go_to_project1.wav"
    "Go to Project 2 - CNN spectrograph - genre identification" = "go_to_project2.wav"
    "Go to Project 3 - Heat Map Audio Player" = "go_to_project3.wav"
    "Go to Project 4 - 2 - by 2 - rubixs cube solver" = "go_to_project4.wav"
}

# Generate and save the audio files
foreach ($phrase in $Phrases.Keys) {
    $outputPath = Join-Path $OutputFolder $Phrases[$phrase]
    $stream = New-Object System.IO.FileStream($outputPath, [System.IO.FileMode]::Create)
    $Synthesizer.SetOutputToWaveStream($stream)
    $Synthesizer.Speak($phrase)
    $stream.Close()
    Write-Output "Saved: $outputPath"
}
