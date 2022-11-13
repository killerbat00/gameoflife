#!/usr/bin/env bash

magenta='\e[1;35m'
red='\e[1;31m'
white='\e[0;37m'

shopt -s extglob

wet_run() {
    local MODE=$1
    local RUN=$2
    if [[ "${MODE,,}" == "dev" ]]; then
        tsc
    fi
    
    echo -e "$red Starting webserver. Open <root>/build/ in your browser... $white"
    python3 -m http.server
}

usage() {
    local program_name
    program_name=${0##*/}
    cat <<EOF
Usage: $program_name {dev|rls} [-r]
Options:
    dev     build development version
    -r      run after building
EOF
}

main() {
    case "$1" in
        ''|-h|--help)
            usage
            exit 0
            ;;
        dev|DEV)
            wet_run $1 $2
            exit 0
            ;;
        *)
            echo -e "$red computer says no $white"
            usage
            exit 1
            ;;
    esac

}

main "$@"
