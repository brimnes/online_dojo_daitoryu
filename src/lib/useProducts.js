'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Fallback data while Supabase not connected or for dev
const MOCK_PRODUCTS = [
  // Months
  { id: 'p-jan', type: 'month', reference: 'jan', title: 'Январь',    description: 'Основы дистанции и базовые захваты.',        price: 1990, is_active: true, sort_order: 1  },
  { id: 'p-feb', type: 'month', reference: 'feb', title: 'Февраль',   description: 'Укэми — техника падений.',                   price: 1990, is_active: true, sort_order: 2  },
  { id: 'p-mar', type: 'month', reference: 'mar', title: 'Март',      description: 'Кихон — базовая техника.',                   price: 1990, is_active: true, sort_order: 3  },
  { id: 'p-apr', type: 'month', reference: 'apr', title: 'Апрель',    description: 'Ирими — вход. Управление балансом укэ.',      price: 1990, is_active: true, sort_order: 4  },
  { id: 'p-may', type: 'month', reference: 'may', title: 'Май',       description: 'Тэнкан — разворот.',                         price: 1990, is_active: true, sort_order: 5  },
  { id: 'p-jun', type: 'month', reference: 'jun', title: 'Июнь',      description: 'Атэми — вспомогательные удары.',             price: 1990, is_active: true, sort_order: 6  },
  { id: 'p-jul', type: 'month', reference: 'jul', title: 'Июль',      description: 'Работа с дзё.',                              price: 1990, is_active: true, sort_order: 7  },
  { id: 'p-aug', type: 'month', reference: 'aug', title: 'Август',    description: 'Работа с вооружённым партнёром.',             price: 1990, is_active: true, sort_order: 8  },
  { id: 'p-sep', type: 'month', reference: 'sep', title: 'Сентябрь',  description: 'Подготовка к аттестации.',                   price: 1990, is_active: true, sort_order: 9  },
  { id: 'p-oct', type: 'month', reference: 'oct', title: 'Октябрь',   description: 'Оё — прикладные техники.',                   price: 1990, is_active: true, sort_order: 10 },
  { id: 'p-nov', type: 'month', reference: 'nov', title: 'Ноябрь',    description: 'Рандори — свободная практика.',              price: 1990, is_active: true, sort_order: 11 },
  { id: 'p-dec', type: 'month', reference: 'dec', title: 'Декабрь',   description: 'Итоги года.',                                price: 1990, is_active: true, sort_order: 12 },
  // Ikkajo sections
  { id: 'p-tachiai',       type: 'section', reference: 'tachiai',       title: 'Тачиай',         description: 'Техники из стойки. Контроль пространства и дистанции.',      price: 4900, is_active: true, sort_order: 20 },
  { id: 'p-idori',         type: 'section', reference: 'idori',         title: 'Идори',           description: 'Техники из положения сидя (сэйза).',                          price: 4900, is_active: true, sort_order: 21 },
  { id: 'p-ushirodori',    type: 'section', reference: 'ushirodori',    title: 'Уширодори',       description: 'Техники защиты от захватов сзади.',                            price: 4900, is_active: true, sort_order: 22 },
  { id: 'p-hanzahandachi', type: 'section', reference: 'hanzahandachi', title: 'Хандза-хандати',  description: 'Техники в смешанных позициях — один сидит, другой стоит.',      price: 4900, is_active: true, sort_order: 23 },
  // Full Ikkajo
  { id: 'p-ikkajo', type: 'section', reference: 'ikkajo', title: 'Весь Иккаджо', description: 'Полный доступ ко всем разделам программы Иккаджо. Включает: Тачиай, Идори, Уширодори и Хандза-хандати.', price: 14900, is_active: true, sort_order: 30 },
];

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error || !data?.length) {
          // Supabase not connected or table doesn't exist yet — use mock
          setProducts(MOCK_PRODUCTS);
        } else {
          setProducts(data);
        }
      } catch {
        setProducts(MOCK_PRODUCTS);
      }
      setLoading(false);
    })();
  }, []);

  return { products, loading };
}
