'use client';

import { useEffect } from 'react';

export default function IndexRedirect() {
  useEffect(() => {
    // Migra todos os dados do localStorage desta página para a raiz
    // (mesmo domínio, então o localStorage é compartilhado)
    // Redireciona para a raiz
    window.location.replace('/');
  }, []);

  return null;
}
