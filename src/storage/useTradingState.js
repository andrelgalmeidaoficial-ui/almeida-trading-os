import { useEffect, useRef, useState } from 'react';
import { tradingStateStorage } from './firebaseStorage.js';
import { normalizeTradingState, stateFingerprint } from './stateCompatibility.js';

export function useTradingState(user, initialState) {
  const [state, setState] = useState(initialState);
  const [loaded, setLoaded] = useState(false);
  const [sync, setSync] = useState('Conectando');
  const hydratedFingerprint = useRef(null);

  useEffect(() => {
    if (!user) {
      setLoaded(false);
      hydratedFingerprint.current = null;
      return undefined;
    }

    setSync('Sincronizando...');
    return tradingStateStorage.subscribe(user.uid, {
      onData(data) {
        const normalized = normalizeTradingState(data, initialState);
        hydratedFingerprint.current = stateFingerprint(normalized);
        setState(normalized);
        setSync('Sincronizado');
        setLoaded(true);
      },
      onMissing() {
        hydratedFingerprint.current = stateFingerprint(initialState);
        setState(initialState);
        setLoaded(true);
        setSync('Base criada');
        tradingStateStorage.create(user.uid, initialState).catch(error => {
          console.error(error);
          setSync('Erro ao salvar');
        });
      },
      onError(error) {
        console.error(error);
        setSync('Erro');
        setLoaded(true);
      }
    });
  }, [user, initialState]);

  useEffect(() => {
    if (!user || !loaded) return undefined;
    const fingerprint = stateFingerprint(state);
    if (fingerprint === hydratedFingerprint.current) return undefined;

    const timer = setTimeout(() => {
      const payload = { ...state, updatedAt: new Date().toISOString() };
      setSync('Salvando...');
      tradingStateStorage.save(user.uid, payload)
        .then(() => setSync('Sincronizado'))
        .catch(error => {
          console.error(error);
          setSync('Erro ao salvar');
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [user, loaded, state]);

  return { state, setState, loaded, sync };
}
