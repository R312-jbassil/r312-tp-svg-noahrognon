import PocketBase from 'pocketbase'

let path = ''

if (import.meta.env.MODE === 'development') {
    path = 'http://localhost:8090' // en local
} else {
    path = 'https://tpsvg2025.noahrognon.fr/' // sur ton VPS
}

const pb = new PocketBase(path)
export default pb
