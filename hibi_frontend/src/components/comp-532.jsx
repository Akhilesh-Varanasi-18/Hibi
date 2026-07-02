import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline"

const items = [
  {
    id: 1,
    date: "Jul 1, 2021",
    title: "Junior Developer",
    description:
      "Joined as a Junior Developer. Assisted in bug fixes, learned codebase, and contributed to small features.",
  },
  {
    id: 2,
    date: "Aug 15, 2022",
    title: "SDE 1",
    description:
      "Promoted to SDE 1. Took ownership of modules, implemented new features, and participated in code reviews.",
  },
  {
    id: 3,
    date: "Oct 10, 2023",
    title: "SDE 2",
    description:
      "Advanced to SDE 2. Led small teams, designed scalable solutions, and mentored junior developers.",
  },
]

export default function Component() {
  return (
    <Timeline defaultValue={3}>
      {items.map((item) => (
        <TimelineItem key={item.id} step={item.id}>
          <TimelineHeader>
            <TimelineSeparator className={"mt-4"} />
            <TimelineDate>{item.date}</TimelineDate>
            <TimelineTitle className="pb-2">{item.title}</TimelineTitle>
            <TimelineIndicator className="w-4 h-4 " />
          </TimelineHeader>
          {/* <TimelineContent>{item.description}</TimelineContent> */}
        </TimelineItem>
      ))}
    </Timeline>
  );
}
