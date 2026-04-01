# Content Data Example

Use something like the following in `src/content/artist.ts`:

```ts
export const artist = {
  name: "Elijah Nang",
  projectName: "Nang Soul",
  domain: "nangsoul.com",
  memorialLabel: "A memorial archive of the music and legacy of Elijah Nang",
  bio: [
    "Elijah Nang was an artist whose work blended lofi hip-hop, jazz textures, electronica, and East Asian influence into a sound that felt deeply cinematic and personal.",
    "His music often carried a worldbuilding quality, treating sound as memory, atmosphere, and narrative rather than simple background listening.",
    "This site is intended as a respectful archive and gateway to the public work he left behind."
  ],
  links: {
    youtube: "https://www.youtube.com/@elijahnang90",
    spotify: "https://open.spotify.com/artist/0yIO6HI875mLzamqmjjFFU",
    soundcloud: "https://soundcloud.com/elijahnang",
    instagram: "https://www.instagram.com/elijahnang/",
    twitch: "https://www.twitch.tv/nangsoul",
    facebook: "https://www.facebook.com/elijahnang91"
  },
  featuredWorks: [
    {
      title: "Gaijin",
      type: "Album",
      description: "A defining project in Elijah Nang’s catalog.",
      url: "https://open.spotify.com/album/3Mz0drsWHgVg5zTm60ncdl"
    },
    {
      title: "Gaijin II Tale of Rai",
      type: "Album",
      description: "A continuation of the sonic world established in Gaijin.",
      url: "https://open.spotify.com/album/79ynbZwBXsmdFZw8Oa0FMK"
    },
    {
      title: "Nang Soul Vol.3 / Akira",
      type: "Beat Tape",
      description: "A project reflecting the broader Nang Soul identity.",
      url: "https://soundcloud.com/elijahnang/nang-soul-vol3-akira-full-beat-tape"
    }
  ],
  disclaimer:
    "This is an unofficial memorial archive created to honor Elijah Nang. All music, video, artwork, and platform content belong to their respective owners."
};
```
