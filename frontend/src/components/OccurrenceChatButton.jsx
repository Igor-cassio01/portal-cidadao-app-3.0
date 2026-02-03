import React, { useState } from 'react'
import { Button } from './ui/button'
import { MessageCircle } from 'lucide-react'
import OccurrenceChat from './OccurrenceChat'

const OccurrenceChatButton = ({ occurrenceId }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Chat
      </Button>

      {isOpen && (
        <OccurrenceChat
          occurrenceId={occurrenceId}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default OccurrenceChatButton

