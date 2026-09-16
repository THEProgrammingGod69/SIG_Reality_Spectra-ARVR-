# `src/components/sections`

Composed page sections: Hero, MissionVision, CoreTeam, TeamHierarchy,
CurrentEvent, EventTimeline, GalleryGrid, DomainList, RecruitmentStatus,
ContactDetails and SponsorshipForm.

Sections receive data as props from their page. They never call the repository
layer themselves, and the admin preview renders the same sections the public
site does.

Built in **Stage 2** (Hero) and **Stages 4, 7 and 8** (the rest).
