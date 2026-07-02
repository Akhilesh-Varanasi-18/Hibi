import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import CarrierHistoryDialog from './Dialogues/carrierHistoryDialog'
import HistoryComponent from './HistoryComponent';

const CareerHistory = () => {
  const [open, setOpen] = useState(false);
  const [update, setupdate] = useState(0)
  const HandleonSave = () => {
    setupdate(prev=>prev+1);
  }
  return (
    <div className='w-full h-screen'>
      <div className='w-full flex justify-end'>
        <Button onClick={() => {
          setOpen(true);
        }}>Add Career History</Button>
      </div>
      <div>
        <HistoryComponent key={update} />
      </div>


      {
        open &&
        < CarrierHistoryDialog open={open} setOpen={setOpen} onSave={HandleonSave} />
      }


    </div>
  )
}

export default CareerHistory