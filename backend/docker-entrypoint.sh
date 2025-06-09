#!/bin/sh
# docker-entrypoint.sh

set -e

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check if TPM devices are available
check_tpm_devices() {
    log "Checking TPM device availability..."
    
    if [ ! -e "/dev/tpm0" ] && [ ! -e "/dev/tpmrm0" ]; then
        log "WARNING: No TPM devices found. TPM functionality will not be available."
        log "Make sure to run container with: --device=/dev/tpm0 --device=/dev/tpmrm0"
        return 1
    fi
    
    if [ -e "/dev/tpm0" ]; then
        log "TPM device /dev/tpm0 found"
        ls -la /dev/tpm0
    fi
    
    if [ -e "/dev/tpmrm0" ]; then
        log "TPM Resource Manager /dev/tpmrm0 found"
        ls -la /dev/tpmrm0
    fi
    
    return 0
}

# Test TPM functionality
test_tpm() {
    log "Testing TPM functionality..."
    log "$(id)"
    if command -v tpm2_getcap >/dev/null 2>&1; then
        if tpm2_getcap properties-fixed >/dev/null 2>&1; then
            log "TPM is accessible and functional"
            return 0
        else
            log "WARNING: TPM device found but not accessible. Check permissions."
            return 1
        fi
    else
        log "ERROR: tpm2_getcap command not found"
        return 1
    fi
}

# Initialize TPM if needed
init_tpm() {
    log "Initializing TPM environment..."
    
    # Set TPM environment variables
    export TPM2TOOLS_TCTI="device:/dev/tpmrm0"
    
    # Create temporary directories
    # mkdir -p /tmp/tpm-service
    # chmod 755 /tmp/tpm-service

    log "TPM environment initialized"
}

# Main execution
main() {
    log "Starting TPM-enabled Node.js application..."
    
    # Check TPM devices
    if check_tpm_devices; then
        # Initialize TPM
        init_tpm
        
        # Test TPM functionality
        if test_tpm; then
            log "TPM initialization successful"
        else
            log "TPM initialization failed, but continuing..."
        fi
    else
        log "Continuing without TPM support..."
    fi
    
    # Execute the main command
    log "Starting application: $@"
    exec "$@"
}

# Run main function
main "$@"
