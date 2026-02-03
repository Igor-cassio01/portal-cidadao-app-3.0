import React from 'react';
import { toast as sonnerToast } from 'sonner';

// Este é um mock simples do hook useToast
// O componente ToastProvider e Toast não estão sendo criados aqui,
// apenas o hook que retorna a função toast.

export function useToast() {
  const toast = ({ title, description, variant }) => {
    // Mapeamento simples de variantes para sonner
    const type = variant === 'destructive' ? 'error' : 'default';

    sonnerToast(title, {
      description: description,
      duration: 3000,
      action: {
        label: 'Fechar',
        onClick: () => console.log('Fechar'),
      },
      type: type,
    });
  };

  return { toast };
}
