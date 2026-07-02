import { Card } from '@/components/ui/card'
import React from 'react'
import CustomAvatar from './CustomAvatar'
import { ColorOpacityChange } from '@/utils/CustomColorPalettes'

const UserCard = ({
  rightSection,
  name,
  desc,
  url,
  showTooltip = false,
  hideBorder,
  employeeId,
  color = "#0B7B4B",
  icon,
  highlight,
  hideName
}) => {
  // Card highlight style
  const cardStyle = highlight
    ? {
        background: ColorOpacityChange(color, 0.13),
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
        transition: "all 0.2s ease"
      }
    : {
        background: "var(--card, #f6f6f6)",
        transition: "all 0.2s ease"
      }

  // Avatar or icon
  const iconDisplay = icon ? (
    <div style={{ color }}>{icon}</div>
  ) : (
    <CustomAvatar url={url} label={name} showTooltip={showTooltip} />
  )

  const content = (
    <Card
      className={`shadow-none flex flex-row items-center w-full p-2 ${rightSection ? "justify-between" : "justify-start"} ${hideBorder ? "border-0" : "border-muted-foreground/10"}`}
      style={cardStyle}
    >
      <div className='flex flex-row items-center gap-2'>
        {iconDisplay}
      </div>
      <div className='flex flex-col ml-4 justify-center items-start'> 
          <span className="text-sm text-foreground/80 capitalize">{hideName || name?.toLowerCase()}</span>
          <span className="text-xs text-foreground/60 capitalize">{desc?.toLowerCase()}</span>
        </div>
        {rightSection && <div className='ml-auto'>{rightSection}</div>}
    </Card>
  );

  return (
    <div className='w-full'>
      {employeeId ? (
        <a target='_blank' href={`/userProfile/${employeeId}`}>
          {content}
        </a>
      ) : content}
    </div>
  );
}

export default UserCard