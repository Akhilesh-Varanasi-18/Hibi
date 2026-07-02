import React from 'react'

const PageHeader = ({title , rightContent}) => {
  return (
    <div className='flex gap-4 items-center justify-between w-full flex-wrap pb-6'>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h1>
        <div className=''>
        {rightContent}
        </div>
    </div>
  )
}

export default PageHeader