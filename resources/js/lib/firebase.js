let _app = null;
let _auth = null;

export async function initFirebase(config) {
    try {
        const { initializeApp, getApps } = await import(/* @vite-ignore */ 'firebase/app');
        const { getAuth } = await import(/* @vite-ignore */ 'firebase/auth');
        if (getApps().length === 0) {
            _app = initializeApp(config);
        } else {
            _app = getApps()[0];
        }
        _auth = getAuth(_app);
    } catch (e) {
        console.warn('Firebase SDK not available:', e);
    }
}

export async function signInWithGoogle() {
    try {
        const { GoogleAuthProvider, signInWithPopup } = await import(/* @vite-ignore */ 'firebase/auth');
        if (!_auth) throw new Error('Firebase not initialized');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(_auth, provider);
        return result.user.getIdToken();
    } catch (e) {
        console.error('Firebase Google Sign-In error:', e);
        throw e;
    }
}
