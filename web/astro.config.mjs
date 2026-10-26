import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { remarkPlayground } from './src/plugins/remark-playground.mjs';
export default defineConfig({
  markdown: { remarkPlugins: [remarkPlayground] },
  integrations: [starlight({
    title: 'JavaScript Workshop',
    logo: { src: './public/assets/misa-mark.svg', replacesTitle: false },
    favicon: '/assets/misa-mark.svg',
    social: [{ icon: 'github', label: 'Workshop repository', href: 'https://github.com/youth-of-may/misa-javascript-workshop' }],
    customCss: ['./src/styles/custom.css', './src/styles/playground.css'],
    components: { Footer: './src/components/Footer.astro' },
    sidebar: [
      { label: 'Before you begin', collapsed: false, items: [
        {label:'Setup and playground',slug:'setup'},
        {label:'Welcome',slug:''},
        {label:'What is JavaScript?',slug:'javascript'},
        {label:'Git and GitHub',slug:'git-github'}
      ] },
      { label: 'Part 1 · Intro to JavaScript', collapsed: false, items: [
        {label:'01 · Say hello',slug:'build/hello'},
        {label:'02 · Make decisions',slug:'build/decisions'},
        {label:'03 · Build the board',slug:'build/board'},
        {label:'04 · Give your code a job',slug:'build/functions'}
      ] },
      { label: 'Part 2 · Mouse and keyboard', collapsed: false, items: [
        {label:'05 · Listen for clicks',slug:'build/clicks'},
        {label:'06 · Follow the mouse',slug:'build/mouse'},
        {label:'07 · Use the keyboard',slug:'build/keyboard'}
      ] },
      { label: 'Part 3 · Modules and classes', collapsed: false, items: [
        {label:'08 · Split code into modules',slug:'build/modules'},
        {label:'09 · Build a class',slug:'build/classes'},
        {label:'10 · Test and personalize',slug:'build/test'}
      ] },
      { label: 'Moving forward', collapsed: false, items: [
        {label:'Where to go next',slug:'moving-forward'},
        {label:'More with arrays',slug:'moving-forward/arrays'},
        {label:'Work with text',slug:'moving-forward/text'},
        {label:'Events in depth',slug:'moving-forward/events'},
        {label:'Mouse, touch, and pen',slug:'moving-forward/pointer-events'},
        {label:'Reuse with inheritance',slug:'moving-forward/inheritance'},
        {label:'Remember a high score',slug:'moving-forward/storage'},
        {label:'Put your game online',slug:'moving-forward/publishing'}
      ] },
      { label: 'Projects', collapsed: false, items: [
        {label:'Pick a project',slug:'projects'},
        {label:'Typing trainer',slug:'projects/typing-trainer'},
        {label:'Sticker board',slug:'projects/sticker-board'},
        {label:'Flashcard deck',slug:'projects/flashcards'}
      ] },
      { label: 'Keep these handy', collapsed: false, items: [{label:'Checkpoints and recovery',slug:'checkpoints'},{label:'Troubleshooting',slug:'help'},{label:'Open the playground',slug:'playground'}] }
    ]
  })]
});
