Add-Type -AssemblyName System.Speech

# Initialize the speech synthesizer
$Synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$Synthesizer.SelectVoice("Microsoft Hazel Desktop")

# Output folder (change if needed)
$OutputFolder = "$PSScriptRoot\VoiceClips"
New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null

# Define filenames as keys and phrases as values
$Phrases = @{
    "01_Welcome.wav" = "...  Welcome to Nathan's Home page."
    "02_Load_CV.wav" = "... Load CV"
    "03_Project1.wav" = "... Load project 1. Senior Design"
    "04_Project2.wav" = "... Load project 2. CNN image analysis"
    "05_Project3.wav" = "... Load project 3. Frequency Time Heat Map Audio Player."
    "06_Project4.wav" = "... Load project 4. Rubix Cube Two-by-Two solver."
}

function Add-SilenceToStart {
    param(
        [string]$InputPath,
        [int]$SilenceMilliseconds = 500
    )

    $bytes = [System.IO.File]::ReadAllBytes($InputPath)

    # Helper to read ASCII string
    function ReadString([byte[]]$data, [int]$offset, [int]$length) {
        return [System.Text.Encoding]::ASCII.GetString($data, $offset, $length)
    }

    # WAV format uses RIFF chunks: Find the "data" chunk offset and size dynamically
    # RIFF header: first 12 bytes: ChunkID(4), ChunkSize(4), Format(4)
    # Followed by subchunks starting at offset 12

    $pos = 12
    $dataChunkPos = -1
    $dataChunkSize = 0

    while ($pos -lt $bytes.Length) {
        $chunkId = ReadString $bytes $pos 4
        $chunkSize = [BitConverter]::ToInt32($bytes, $pos + 4)

        if ($chunkId -eq "data") {
            $dataChunkPos = $pos + 8
            $dataChunkSize = $chunkSize
            break
        }
        # Move to next chunk (8 bytes header + chunkSize)
        $pos += 8 + $chunkSize
    }

    if ($dataChunkPos -eq -1) {
        throw "Data chunk not found in WAV file."
    }

    # Parse format chunk to get sample rate, bits per sample, channels
    # Usually fmt chunk is right after RIFF header, offset 12
    # Find "fmt " chunk similarly

    $pos = 12
    $sampleRate = 0
    $bitsPerSample = 0
    $channels = 0

    while ($pos -lt $bytes.Length) {
        $chunkId = ReadString $bytes $pos 4
        $chunkSize = [BitConverter]::ToInt32($bytes, $pos + 4)

        if ($chunkId -eq "fmt ") {
            $audioFormat = [BitConverter]::ToInt16($bytes, $pos + 8)
            $channels = [BitConverter]::ToInt16($bytes, $pos + 10)
            $sampleRate = [BitConverter]::ToInt32($bytes, $pos + 12)
            $bitsPerSample = [BitConverter]::ToInt16($bytes, $pos + 22)
            break
        }
        $pos += 8 + $chunkSize
    }

    if ($sampleRate -eq 0 -or $bitsPerSample -eq 0 -or $channels -eq 0) {
        throw "Failed to read WAV format information."
    }

    $bytesPerSample = $bitsPerSample / 8
    $bytesPerMs = $sampleRate * $bytesPerSample * $channels / 1000
    $silenceBytesCount = [int]($bytesPerMs * $SilenceMilliseconds)

    # Prepare silence bytes
    $silence = New-Object byte[] $silenceBytesCount

    # Construct new WAV byte array
    $newDataChunkSize = $dataChunkSize + $silenceBytesCount
    $newFileSize = $bytes.Length + $silenceBytesCount - 8

    $newBytes = New-Object byte[] ($bytes.Length + $silenceBytesCount)

    # Copy all bytes up to start of data chunk's audio data
    [Array]::Copy($bytes, 0, $newBytes, 0, $dataChunkPos)

    # Copy silence after header but before audio data
    [Array]::Copy($silence, 0, $newBytes, $dataChunkPos, $silenceBytesCount)

    # Copy original audio data after silence
    [Array]::Copy($bytes, $dataChunkPos, $newBytes, $dataChunkPos + $silenceBytesCount, $dataChunkSize)

    # Update ChunkSize (file size - 8) at offset 4
    ([BitConverter]::GetBytes($newFileSize)).CopyTo($newBytes, 4)

    # Update Subchunk2Size (data chunk size) at offset of "data" chunk + 4 (which is $dataChunkPos - 4)
    ([BitConverter]::GetBytes($newDataChunkSize)).CopyTo($newBytes, $dataChunkPos - 4)

    # Overwrite file
    [System.IO.File]::WriteAllBytes($InputPath, $newBytes)
}



foreach ($filename in $Phrases.Keys) {
    $text = $Phrases[$filename]
    $outputPath = Join-Path $OutputFolder $filename

    # Generate speech WAV
    $stream = New-Object System.IO.FileStream($outputPath, [System.IO.FileMode]::Create)
    $Synthesizer.SetOutputToWaveStream($stream)
    $Synthesizer.Speak($text)
    $Synthesizer.SetOutputToNull()
    $stream.Close()

    # Prepend 100 ms silence at the start of the WAV file
    Add-SilenceToStart -InputPath $outputPath -SilenceMilliseconds 100

    Write-Output "Saved with 100ms silence at start: $outputPath"
}

Write-Output "✅ All files processed."
