# Snapshot Format

Snapshots are captured as JSON data, pulled directly from the front-end API requests that build the LMS UI. If capturing a single course (i.e. not using the `--all` flag), the JSON file output is:

```ts
{
  // always included
  Metadata: {
    Host: "example.myschoolapp.com", // base hostname for all relative URLs
    User: "admin@example.com", // email address of user capturing the snapshot
    Start: "2024-12-05T22:59:35.336Z", // human-readable timestamp of snapshot start time,
    Finish: "2024-12-05T22:59:42.212Z" // human-readable timestamp of snapshot finish time,
  },

  // included unless unavailable from the LMS
  SectionInfo?: {
    Id: 12345678, // group ID within the system
    // ... metadata about the group (course, activity, team, advisory…)
  },

  // included unless --no-bulletinBoard flag is used
  BulletinBoard?: [ // list of bulletin board items
    {
      // ... layout information for the content item
      Content: [ // list of content parts (e.g. downloads, links, etc.)
        {
          // ... content data varies by item type
        }
      ]
    }
  ],

  // included unless --no-topics flag is used
  Topics?: [
    {
      // ... topic metadata
      Content: [
        {
          // content data varies by item type
        }
      ]
    }
  ],

  // included unless --no-assignments flag is used
  Assigments?: [
    {
      // assignment data varies by assignment type (discussion, LTI placement, online file submission, etc.)
    }
  ],

  // included unless --no-gradebook flag is used
  Gradebook?: {
    markingPeriods: [
      {
        // marking period data
      }
    ],
    Gradebook: {
      DisplayOptions: {
        // display settings
      },
      Roster: [
        {
          // ... student roster data, including per assigment gradebook data
        }
      ],
      Assignments: [
        {
          // ... assignment data (limited compared to main Assignments list)
        }
      ],
      Summary: {
        // ... gradebook summary data
      },
      Access: {
        // ... access privileges for snapshotting user
      }
    }
  }
}
```

When snapshotting multiple sections (i.e. using the `--all` flag), the snapshot file is an array of snapshots, as described above.

```ts
[
  {
    // ... snapshot data
  }
];
```
