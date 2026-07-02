import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
  
  export function AccordionDemo({Title , Desc}) {
    return (
      <Accordion
        type="single"
        collapsible
        className="w-full"
        defaultValue="item-1"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>{Title}</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            {
                Desc
            }
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
  }
  