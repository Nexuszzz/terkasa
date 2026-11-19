'use client'

import { Check, Minus, Plus, RotateCcw, Warehouse } from 'lucide-react'
import { useState } from 'react'
import s from './landing.module.css'

const startingHerd = [
  {
    id: 'sapi',
    name: 'Sapi Limousin',
    species: 'Sapi',
    pen: 'Kandang A',
    count: 24,
    price: 25_000_000,
    symbol: 'S',
  },
  {
    id: 'domba',
    name: 'Domba Garut',
    species: 'Domba',
    pen: 'Kandang B',
    count: 18,
    price: 3_500_000,
    symbol: 'D',
  },
  {
    id: 'kambing',
    name: 'Kambing Etawa',
    species: 'Kambing',
    pen: 'Kandang C',
    count: 12,
    price: 4_000_000,
    symbol: 'K',
  },
]
const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function InventoryDemo() {
  const [herd, setHerd] = useState(startingHerd)
  const [filter, setFilter] = useState('Semua')
  const [notice, setNotice] = useState(
    'Coba tombol + dan − untuk mengubah jumlah ternak.',
  )
  const total = herd.reduce((sum, animal) => sum + animal.count, 0)
  const value = herd.reduce(
    (sum, animal) => sum + animal.price * animal.count,
    0,
  )
  function adjust(id: string, delta: number) {
    const animal = herd.find((item) => item.id === id)!
    const next = Math.min(999, Math.max(0, animal.count + delta))
    setHerd((items) =>
      items.map((item) => (item.id === id ? { ...item, count: next } : item)),
    )
    setNotice(`${animal.name}: ${next} ekor. Perubahan hanya pada demo ini.`)
  }
  return (
    <div className={s.demo} aria-label="Demo interaktif inventori ternak">
      <div className={s.demoTop}>
        <div className={s.demoFarm}>
          <span className={s.demoFarmIcon}>
            <Warehouse size={21} aria-hidden="true" />
          </span>
          <div>
            <strong>Peternakan Makmur</strong>
            <span>Ruang kerja peternakan</span>
          </div>
        </div>
        <span className={s.demoLabel}>Data demo</span>
      </div>
      <div className={s.demoTitle}>
        <h3>Inventori ternak</h3>
        <span>
          <Check size={14} aria-hidden="true" /> Tercatat rapi
        </span>
      </div>
      <div className={s.demoMetrics}>
        <div>
          <span>Total ternak</span>
          <strong>
            {total}
            <small>ekor</small>
          </strong>
        </div>
        <div>
          <span>Jenis ternak</span>
          <strong>
            3<small>jenis</small>
          </strong>
        </div>
        <div>
          <span>Estimasi nilai jual</span>
          <strong className={s.demoValue}>{rupiah.format(value)}</strong>
        </div>
      </div>
      <div
        className={s.demoFilters}
        role="group"
        aria-label="Filter demo ternak"
      >
        {['Semua', 'Sapi', 'Domba', 'Kambing'].map((item) => (
          <button
            key={item}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className={s.demoRows}>
        {herd
          .filter((animal) => filter === 'Semua' || filter === animal.species)
          .map((animal) => (
            <div key={animal.id} className={s.demoRow}>
              <span
                className={`${s.animalMonogram} ${s[animal.id]}`}
                aria-hidden="true"
              >
                {animal.symbol}
              </span>
              <div className={s.animalName}>
                <strong>{animal.name}</strong>
                <span>{animal.pen}</span>
              </div>
              <div className={s.demoStepper}>
                <button
                  aria-label={`Kurangi ${animal.name}`}
                  disabled={animal.count === 0}
                  onClick={() => adjust(animal.id, -1)}
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <span>
                  {animal.count}
                  <small>ekor</small>
                </span>
                <button
                  aria-label={`Tambah ${animal.name}`}
                  disabled={animal.count === 999}
                  onClick={() => adjust(animal.id, 1)}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
      </div>
      <div className={s.demoBottom}>
        <p role="status" aria-live="polite">
          {notice}
        </p>
        <button
          onClick={() => {
            setHerd(startingHerd)
            setFilter('Semua')
            setNotice('Demo direset ke 54 ekor.')
          }}
          aria-label="Reset demo inventori"
        >
          <RotateCcw size={15} aria-hidden="true" /> Reset
        </button>
      </div>
    </div>
  )
}
