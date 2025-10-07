import PocketBase from 'pocketbase';

const pocketbaseUrl = import.meta.env.PB_URL ?? 'http://127.0.0.1:8090';

const pb = new PocketBase(pocketbaseUrl);

export default pb;

