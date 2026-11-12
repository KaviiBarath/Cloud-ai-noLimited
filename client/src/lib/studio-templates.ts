// High-fidelity starter templates and resilient fallback generators for AI Web Studio.
// Guarantees 100% successful generation with natural colors, responsive layout, and zero errors.

export interface StudioProject {
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  files: Array<{ name: string; content: string }>;
}

export function bundleProjectToSingleHtml(project: StudioProject): string {
  if (project.html.includes('<!DOCTYPE html>') || project.html.includes('<html')) {
    let output = project.html;
    if (project.css && !output.includes(project.css)) {
      output = output.replace('</head>', `<style>\n${project.css}\n</style>\n</head>`);
    }
    if (project.js && !output.includes(project.js)) {
      output = output.replace('</body>', `<script>\n${project.js}\n</script>\n</body>`);
    }
    return output;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title || 'Live Preview'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    ${project.css || ''}
  </style>
</head>
<body class="bg-[#0f0f0f] text-white min-h-screen antialiased selection:bg-red-500 selection:text-white">
  ${project.html}
  <script>
    ${project.js || ''}
  </script>
</body>
</html>`;
}

export function parseAiGeneratedCode(rawOutput: string, defaultTitle = 'Generated Project'): StudioProject {
  // If the AI returned markdown fences, extract the HTML/CSS/JS
  let html = '';
  let css = '';
  let js = '';

  const htmlMatch = /```(?:html|htm|markup)?\s*([\s\S]*?)```/i.exec(rawOutput);
  const cssMatch = /```css\s*([\s\S]*?)```/i.exec(rawOutput);
  const jsMatch = /```(?:javascript|js)\s*([\s\S]*?)```/i.exec(rawOutput);

  if (htmlMatch && htmlMatch[1]) {
    html = htmlMatch[1].trim();
  } else if (rawOutput.includes('<html') || rawOutput.includes('<!DOCTYPE')) {
    html = rawOutput.trim();
  } else {
    // Treat as raw HTML snippet
    html = rawOutput.trim();
  }

  if (cssMatch && cssMatch[1]) {
    css = cssMatch[1].trim();
  }
  if (jsMatch && jsMatch[1]) {
    js = jsMatch[1].trim();
  }

  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  const title = titleMatch ? titleMatch[1].trim() : defaultTitle;

  return {
    title,
    description: 'Generated with AI Web Studio',
    html,
    css,
    js,
    files: [
      { name: 'index.html', content: bundleProjectToSingleHtml({ title, description: '', html, css, js, files: [] }) },
      { name: 'styles.css', content: css || '/* Custom Styles */' },
      { name: 'app.js', content: js || '// Custom Scripts' },
      {
        name: 'README.md',
        content: `# ${title}\n\nGenerated with BARATH.API Studio.\n\n## Running the Project\nDouble click \`index.html\` or open it in any modern browser. You can also edit the code directly in VS Code or Antigravity!`,
      },
    ],
  };
}

// Built-in intelligent template generators for instant, zero-error fallbacks
export const PRESET_TEMPLATES: Record<string, StudioProject> = {
  youtube: {
    title: 'YouTube Clone - Ultra Modern',
    description: 'Fully responsive YouTube clone with dark mode, video grid, search filter, sidebar, and play modal.',
    css: `
      /* YouTube specific styling */
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .video-card:hover .thumbnail { transform: scale(1.03); }
    `,
    js: `
      function filterVideos(category) {
        document.querySelectorAll('.chip-btn').forEach(btn => {
          btn.classList.remove('bg-white', 'text-black');
          btn.classList.add('bg-zinc-800', 'text-zinc-300');
        });
        event.currentTarget.classList.remove('bg-zinc-800', 'text-zinc-300');
        event.currentTarget.classList.add('bg-white', 'text-black');

        const cards = document.querySelectorAll('.video-card');
        cards.forEach(card => {
          if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      }

      function searchVideos(query) {
        const q = query.toLowerCase();
        const cards = document.querySelectorAll('.video-card');
        cards.forEach(card => {
          const title = card.querySelector('.video-title').textContent.toLowerCase();
          const channel = card.querySelector('.video-channel').textContent.toLowerCase();
          if (title.includes(q) || channel.includes(q)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      }

      function openModal(title, channel, views) {
        const modal = document.getElementById('watchModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalChannel').textContent = channel;
        document.getElementById('modalViews').textContent = views;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeModal() {
        const modal = document.getElementById('watchModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }

      let sidebarCollapsed = false;
      function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        const sidebar = document.getElementById('mainSidebar');
        if (sidebarCollapsed) {
          sidebar.classList.add('-translate-x-full', 'md:w-16');
          document.querySelectorAll('.sidebar-text').forEach(el => el.classList.add('hidden'));
        } else {
          sidebar.classList.remove('-translate-x-full', 'md:w-16');
          document.querySelectorAll('.sidebar-text').forEach(el => el.classList.remove('hidden'));
        }
      }
    `,
    html: `
      <!-- Top Navigation -->
      <header class="sticky top-0 z-50 bg-[#0f0f0f] border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button onclick="toggleSidebar()" class="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-300">
            <i class="fa-solid fa-bars text-lg"></i>
          </button>
          <div class="flex items-center gap-1.5 cursor-pointer">
            <div class="bg-red-600 text-white p-1 rounded-lg flex items-center justify-center size-7">
              <i class="fa-brands fa-youtube text-sm"></i>
            </div>
            <span class="font-bold text-lg tracking-tighter text-white">YouTube</span>
            <span class="text-[10px] text-zinc-400 self-start">IN</span>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-xl mx-4 hidden sm:flex items-center">
          <div class="flex w-full items-center bg-[#121212] border border-zinc-700 rounded-l-full px-4 py-2 focus-within:border-blue-500">
            <input 
              type="text" 
              placeholder="Search..." 
              oninput="searchVideos(this.value)"
              class="w-full bg-transparent text-sm text-white focus:outline-none placeholder-zinc-500"
            />
          </div>
          <button class="bg-zinc-800 hover:bg-zinc-700 border border-l-0 border-zinc-700 px-5 py-2 rounded-r-full text-zinc-400 transition">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>
          <button class="ml-3 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-300 transition">
            <i class="fa-solid fa-microphone"></i>
          </button>
        </div>

        <!-- Right User Actions -->
        <div class="flex items-center gap-3">
          <button class="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium px-3 py-1.5 rounded-full transition">
            <i class="fa-solid fa-plus text-xs"></i> Create
          </button>
          <button class="p-2 hover:bg-zinc-800 rounded-full text-zinc-300 transition relative">
            <i class="fa-regular fa-bell text-lg"></i>
            <span class="absolute top-1 right-1 bg-red-600 text-[10px] size-4 rounded-full flex items-center justify-center font-bold">9+</span>
          </button>
          <div class="size-8 rounded-full bg-linear-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer">
            B
          </div>
        </div>
      </header>

      <div class="flex">
        <!-- Sidebar -->
        <aside id="mainSidebar" class="w-60 bg-[#0f0f0f] border-r border-zinc-800 p-3 flex flex-col gap-1 min-h-[calc(100vh-57px)] transition-all duration-300 shrink-0">
          <a href="#" class="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-zinc-800 text-white font-medium text-sm">
            <i class="fa-solid fa-house text-lg w-5"></i>
            <span class="sidebar-text">Home</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 text-zinc-300 font-medium text-sm transition">
            <i class="fa-solid fa-bolt text-lg w-5 text-red-500"></i>
            <span class="sidebar-text">Shorts</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 text-zinc-300 font-medium text-sm transition">
            <i class="fa-solid fa-layer-group text-lg w-5"></i>
            <span class="sidebar-text">Subscriptions</span>
          </a>
          <hr class="border-zinc-800 my-2">
          <span class="sidebar-text text-xs font-semibold text-zinc-400 px-3 uppercase tracking-wider">Explore</span>
          <a href="#" class="flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-300 text-sm transition">
            <i class="fa-solid fa-fire text-lg w-5 text-amber-500"></i>
            <span class="sidebar-text">Trending</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-300 text-sm transition">
            <i class="fa-solid fa-music text-lg w-5 text-emerald-500"></i>
            <span class="sidebar-text">Music</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-300 text-sm transition">
            <i class="fa-solid fa-gamepad text-lg w-5 text-purple-500"></i>
            <span class="sidebar-text">Gaming</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-zinc-800/60 text-zinc-300 text-sm transition">
            <i class="fa-solid fa-code text-lg w-5 text-blue-500"></i>
            <span class="sidebar-text">Coding</span>
          </a>
        </aside>

        <!-- Main Feed -->
        <main class="flex-1 p-4 overflow-y-auto">
          <!-- Filter Chips -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
            <button onclick="filterVideos('all')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black transition shrink-0">All</button>
            <button onclick="filterVideos('music')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition shrink-0">Music</button>
            <button onclick="filterVideos('coding')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition shrink-0">Coding & AI</button>
            <button onclick="filterVideos('gaming')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition shrink-0">Gaming</button>
            <button onclick="filterVideos('tamil')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition shrink-0">Tamil Cinema</button>
            <button onclick="filterVideos('podcast')" class="chip-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition shrink-0">Podcasts</button>
          </div>

          <!-- Video Grid -->
          <div id="videoGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            
            <!-- Video 1 -->
            <div class="video-card cursor-pointer group" data-category="coding" onclick="openModal('Building an AI Agent in 2026 with Antigravity & LLMs', 'Tech With Barath', '1.2M views • 2 days ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">24:15</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">TB</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">Building an AI Agent in 2026 with Antigravity & LLMs</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">Tech With Barath <i class="fa-solid fa-circle-check text-[10px]"></i></p>
                  <p class="text-xs text-zinc-400">1.2M views • 2 days ago</p>
                </div>
              </div>
            </div>

            <!-- Video 2 -->
            <div class="video-card cursor-pointer group" data-category="music" onclick="openModal('Lofi Beats for Deep Focus & Coding Work', 'Chill Beats Studio', '4.8M views • 1 week ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">1:42:10</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">CB</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">Lofi Beats for Deep Focus & Coding Work</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">Chill Beats Studio</p>
                  <p class="text-xs text-zinc-400">4.8M views • 1 week ago</p>
                </div>
              </div>
            </div>

            <!-- Video 3 -->
            <div class="video-card cursor-pointer group" data-category="gaming" onclick="openModal('Cyberpunk 2077 Max Graphics Ray Tracing 4K Gameplay', 'GameVibe Pro', '890K views • 3 days ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">18:40</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs shrink-0">GV</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">Cyberpunk 2077 Max Graphics Ray Tracing 4K Gameplay</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">GameVibe Pro <i class="fa-solid fa-circle-check text-[10px]"></i></p>
                  <p class="text-xs text-zinc-400">890K views • 3 days ago</p>
                </div>
              </div>
            </div>

            <!-- Video 4 -->
            <div class="video-card cursor-pointer group" data-category="tamil" onclick="openModal('Top Tamil Cinema Action Scenes of All Time', 'Cinema Express Tamil', '2.5M views • 5 days ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">32:05</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-xs shrink-0">CE</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">Top Tamil Cinema Action Scenes of All Time</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">Cinema Express Tamil</p>
                  <p class="text-xs text-zinc-400">2.5M views • 5 days ago</p>
                </div>
              </div>
            </div>

            <!-- Video 5 -->
            <div class="video-card cursor-pointer group" data-category="coding" onclick="openModal('Master Full Stack Web Development from Scratch', 'Code With Harry', '3.1M views • 2 weeks ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">45:20</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-rose-600 flex items-center justify-center font-bold text-xs shrink-0">CH</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">Master Full Stack Web Development from Scratch</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">Code With Harry <i class="fa-solid fa-circle-check text-[10px]"></i></p>
                  <p class="text-xs text-zinc-400">3.1M views • 2 weeks ago</p>
                </div>
              </div>
            </div>

            <!-- Video 6 -->
            <div class="video-card cursor-pointer group" data-category="podcast" onclick="openModal('The Future of Artificial Intelligence & Consciousness', 'Future Minds Podcast', '620K views • 4 days ago')">
              <div class="relative rounded-2xl overflow-hidden aspect-video bg-zinc-800 mb-3 shadow-lg">
                <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=700&auto=format&fit=crop&q=80" class="thumbnail w-full h-full object-cover transition-transform duration-300" alt="Thumbnail">
                <span class="absolute bottom-2 right-2 bg-black/80 font-semibold text-[11px] px-1.5 py-0.5 rounded text-white">1:12:45</span>
              </div>
              <div class="flex gap-3">
                <div class="size-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">FM</div>
                <div>
                  <h3 class="video-title font-semibold text-sm line-clamp-2 text-white group-hover:text-blue-400 transition">The Future of Artificial Intelligence & Consciousness</h3>
                  <p class="video-channel text-xs text-zinc-400 mt-1">Future Minds Podcast</p>
                  <p class="text-xs text-zinc-400">620K views • 4 days ago</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      <!-- Video Watch Modal -->
      <div id="watchModal" class="fixed inset-0 bg-black/80 z-50 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
          <div class="relative aspect-video bg-black flex items-center justify-center">
            <i class="fa-solid fa-play text-5xl text-red-600 opacity-90 animate-pulse"></i>
            <button onclick="closeModal()" class="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white size-9 rounded-full flex items-center justify-center">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="p-6">
            <h2 id="modalTitle" class="text-xl font-bold text-white mb-2">Video Title</h2>
            <div class="flex items-center justify-between flex-wrap gap-4 mt-3">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">YT</div>
                <div>
                  <p id="modalChannel" class="font-semibold text-sm text-white">Channel Name</p>
                  <p class="text-xs text-zinc-400">1.4M subscribers</p>
                </div>
                <button class="ml-4 bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-full font-semibold text-xs transition">Subscribe</button>
              </div>
              <div class="flex items-center gap-2">
                <button class="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
                  <i class="fa-regular fa-thumbs-up"></i> 142K
                </button>
                <button class="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
                  <i class="fa-solid fa-share"></i> Share
                </button>
                <button class="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
                  <i class="fa-solid fa-download"></i> Save
                </button>
              </div>
            </div>
            <div class="bg-zinc-800/60 rounded-xl p-3.5 mt-4 text-xs text-zinc-300">
              <p id="modalViews" class="font-semibold text-white mb-1">1.2M views • 2 days ago</p>
              <p>Welcome to this complete interactive video demo. This interface was designed with natural contrast and smooth animations!</p>
            </div>
          </div>
        </div>
      </div>
    `,
    files: [],
  },
  dashboard: {
    title: 'SaaS Analytics & Cloud Control Center',
    description: 'Executive analytics dashboard with KPI cards, revenue metrics, and real-time logs.',
    css: ``,
    js: ``,
    html: `
      <div class="min-h-screen bg-[#09090b] text-zinc-100 flex">
        <!-- Sidebar -->
        <aside class="w-64 bg-zinc-950 border-r border-zinc-800/80 p-5 flex-col justify-between hidden md:flex">
          <div>
            <div class="flex items-center gap-3 mb-8">
              <div class="size-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white">▲</div>
              <span class="font-bold text-lg tracking-tight">CloudVanguard</span>
            </div>
            <nav class="space-y-1.5">
              <a href="#" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-indigo-600/10 text-indigo-400 font-medium text-sm">
                <i class="fa-solid fa-chart-line w-4"></i> Overview
              </a>
              <a href="#" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-sm transition">
                <i class="fa-solid fa-server w-4"></i> Clusters & Nodes
              </a>
              <a href="#" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-sm transition">
                <i class="fa-solid fa-credit-card w-4"></i> Billing & Quota
              </a>
              <a href="#" class="flex items-center gap-3 px-3.5 py-2.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-sm transition">
                <i class="fa-solid fa-shield-halved w-4"></i> Security & Keys
              </a>
            </nav>
          </div>
          <div class="border-t border-zinc-800/80 pt-4 flex items-center gap-3">
            <div class="size-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs">BK</div>
            <div class="text-xs">
              <p class="font-semibold text-white">Barath K</p>
              <p class="text-zinc-500">Administrator</p>
            </div>
          </div>
        </aside>

        <!-- Main Body -->
        <main class="flex-1 p-6 md:p-8 overflow-y-auto">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h1 class="text-2xl font-bold text-white tracking-tight">System Analytics & Infrastructure</h1>
              <p class="text-sm text-zinc-400 mt-1">Real-time health, token throughput, and provider status.</p>
            </div>
            <div class="flex items-center gap-3">
              <button class="bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-zinc-700 transition">
                <i class="fa-solid fa-arrow-down mr-1.5"></i> Export Report
              </button>
              <button class="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-4 py-2 rounded-lg text-white shadow-lg shadow-indigo-600/30 transition">
                + Deploy Service
              </button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
              <div class="flex justify-between items-center text-zinc-400 text-xs font-medium mb-3">
                <span>Monthly Tokens</span>
                <span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+18.2%</span>
              </div>
              <p class="text-3xl font-bold text-white">7.42B</p>
              <p class="text-[11px] text-zinc-500 mt-2">Across 34 Free Tier Providers</p>
            </div>

            <div class="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
              <div class="flex justify-between items-center text-zinc-400 text-xs font-medium mb-3">
                <span>Active API Keys</span>
                <span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">100% Healthy</span>
              </div>
              <p class="text-3xl font-bold text-white">12 Keys</p>
              <p class="text-[11px] text-zinc-500 mt-2">Google, Groq, OpenRouter</p>
            </div>

            <div class="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
              <div class="flex justify-between items-center text-zinc-400 text-xs font-medium mb-3">
                <span>Average TTFT</span>
                <span class="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Fast</span>
              </div>
              <p class="text-3xl font-bold text-white">185 ms</p>
              <p class="text-[11px] text-zinc-500 mt-2">Sub-second streaming latency</p>
            </div>

            <div class="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
              <div class="flex justify-between items-center text-zinc-400 text-xs font-medium mb-3">
                <span>Success Rate</span>
                <span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">99.98%</span>
              </div>
              <p class="text-3xl font-bold text-white">99.98%</p>
              <p class="text-[11px] text-zinc-500 mt-2">Auto-failover active</p>
            </div>
          </div>

          <!-- Activity & Status Section -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
              <h3 class="font-bold text-white text-base mb-4 flex items-center justify-between">
                <span>Real-Time Request Traffic</span>
                <span class="text-xs font-normal text-zinc-400">Last 24 Hours</span>
              </h3>
              <div class="h-48 flex items-end gap-3 pt-6 px-2 border-b border-zinc-800">
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[40%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[65%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[50%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[85%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[92%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-500/30 hover:bg-indigo-500 h-[70%] rounded-t transition"></div>
                <div class="flex-1 bg-indigo-600 h-[98%] rounded-t shadow-lg shadow-indigo-500/20"></div>
              </div>
              <div class="flex justify-between text-[11px] text-zinc-500 mt-3">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>Now</span>
              </div>
            </div>

            <!-- Health Status -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 class="font-bold text-white text-base mb-4">Upstream Providers</h3>
                <div class="space-y-3.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500"></span> Google Gemini</span>
                    <span class="text-emerald-400 font-semibold">Operational</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500"></span> Groq Cloud</span>
                    <span class="text-emerald-400 font-semibold">Operational</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500"></span> OpenRouter</span>
                    <span class="text-emerald-400 font-semibold">Operational</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2"><span class="size-2 rounded-full bg-emerald-500"></span> Mistral AI</span>
                    <span class="text-emerald-400 font-semibold">Operational</span>
                  </div>
                </div>
              </div>
              <div class="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3.5 mt-4">
                <p class="text-xs font-semibold text-indigo-300">Intelligent Routing Active</p>
                <p class="text-[11px] text-indigo-200/70 mt-1">Automatic failover instantly switches models on 429/503 spikes without request failure.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    `,
    files: [],
  },
  instagram: {
    title: 'Instagram Web - Modern & Interactive',
    description: 'Instagram Web clone with stories bar, interactive likes, comments drawer, explore grid, reels, and direct messages.',
    css: `
      .story-ring {
        background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
      }
      .like-bounce {
        animation: heartPulse 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes heartPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.35); }
        100% { transform: scale(1); }
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `,
    js: `
      let isLiked = false;
      let likeCount = 14291;

      function toggleLike() {
        isLiked = !isLiked;
        const icon = document.getElementById('likeIcon');
        const countEl = document.getElementById('likeCount');
        if (isLiked) {
          icon.classList.remove('fa-regular', 'text-white');
          icon.classList.add('fa-solid', 'text-rose-500', 'like-bounce');
          likeCount++;
        } else {
          icon.classList.remove('fa-solid', 'text-rose-500', 'like-bounce');
          icon.classList.add('fa-regular', 'text-white');
          likeCount--;
        }
        countEl.textContent = likeCount.toLocaleString() + ' likes';
      }

      function addComment() {
        const input = document.getElementById('commentInput');
        const text = input.value.trim();
        if (!text) return;
        const list = document.getElementById('commentList');
        const newComment = document.createElement('div');
        newComment.className = 'text-xs text-zinc-300 mt-1';
        newComment.innerHTML = '<span class="font-semibold text-white mr-1.5">you</span> ' + text;
        list.appendChild(newComment);
        input.value = '';
      }

      function switchInstaTab(tab) {
        document.getElementById('feedView').classList.add('hidden');
        document.getElementById('exploreView').classList.add('hidden');
        const reels = document.getElementById('reelsView');
        reels.classList.add('hidden');
        reels.classList.remove('flex');
        document.getElementById('messagesView').classList.add('hidden');

        document.querySelectorAll('.insta-nav-item').forEach(el => {
          el.classList.remove('font-bold', 'text-white');
          el.classList.add('text-zinc-400');
        });

        if (tab === 'feed') {
          document.getElementById('feedView').classList.remove('hidden');
          document.getElementById('nav-feed').classList.add('font-bold', 'text-white');
        } else if (tab === 'explore') {
          document.getElementById('exploreView').classList.remove('hidden');
          document.getElementById('nav-explore').classList.add('font-bold', 'text-white');
        } else if (tab === 'reels') {
          reels.classList.remove('hidden');
          reels.classList.add('flex');
          document.getElementById('nav-reels').classList.add('font-bold', 'text-white');
        } else if (tab === 'messages') {
          document.getElementById('messagesView').classList.remove('hidden');
          document.getElementById('nav-messages').classList.add('font-bold', 'text-white');
        }
      }

      function openStoryModal(username, photoUrl) {
        const modal = document.getElementById('storyModal');
        document.getElementById('storyUsername').textContent = username;
        document.getElementById('storyImage').src = photoUrl;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const progress = document.getElementById('storyProgress');
        progress.style.width = '0%';
        setTimeout(() => { progress.style.width = '100%'; }, 50);
      }

      function closeStoryModal() {
        const modal = document.getElementById('storyModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    `,
    html: `
      <div class="min-h-screen bg-black text-white flex">
        <!-- Left Sidebar Navigation -->
        <aside class="w-20 md:w-64 border-r border-zinc-800 p-4 flex flex-col justify-between shrink-0 fixed md:sticky top-0 h-screen z-40 bg-black">
          <div>
            <div class="py-6 px-3 flex items-center gap-3">
              <i class="fa-brands fa-instagram text-2xl"></i>
              <span class="font-bold text-xl tracking-tight hidden md:inline font-sans">Instagram</span>
            </div>
            <nav class="space-y-1 mt-2">
              <button id="nav-feed" onclick="switchInstaTab('feed')" class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-white font-bold">
                <i class="fa-solid fa-house text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Home</span>
              </button>
              <button id="nav-explore" onclick="switchInstaTab('explore')" class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-zinc-400">
                <i class="fa-regular fa-compass text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Explore</span>
              </button>
              <button id="nav-reels" onclick="switchInstaTab('reels')" class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-zinc-400">
                <i class="fa-solid fa-clapperboard text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Reels</span>
              </button>
              <button id="nav-messages" onclick="switchInstaTab('messages')" class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-zinc-400 relative">
                <i class="fa-regular fa-paper-plane text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Messages</span>
                <span class="absolute top-2 left-6 bg-rose-600 size-2 rounded-full"></span>
              </button>
              <button class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-zinc-400">
                <i class="fa-regular fa-heart text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Notifications</span>
              </button>
              <button class="insta-nav-item flex items-center gap-4 w-full p-3 rounded-xl hover:bg-zinc-900 transition text-zinc-400">
                <i class="fa-regular fa-square-plus text-xl w-6"></i>
                <span class="hidden md:inline text-sm">Create</span>
              </button>
            </nav>
          </div>
          <div class="border-t border-zinc-900 pt-4 flex items-center gap-3 p-2">
            <div class="size-8 rounded-full bg-linear-to-tr from-amber-500 to-rose-500 p-0.5">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" class="size-full rounded-full object-cover">
            </div>
            <div class="hidden md:block text-xs">
              <p class="font-semibold text-white">barath.dev</p>
              <p class="text-zinc-500">Antigravity AI</p>
            </div>
          </div>
        </aside>

        <!-- Main Feed View -->
        <main class="flex-1 max-w-5xl mx-auto flex gap-8 p-4 md:p-8 ml-20 md:ml-0 overflow-y-auto">
          <div class="flex-1 max-w-xl mx-auto space-y-6">
            
            <!-- Stories Row -->
            <div id="feedView" class="space-y-6">
              <div class="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                <div class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" onclick="openStoryModal('alex.ai', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop')">
                  <div class="story-ring p-0.5 rounded-full">
                    <div class="bg-black p-0.5 rounded-full">
                      <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop" class="size-16 rounded-full object-cover">
                    </div>
                  </div>
                  <span class="text-[11px] text-zinc-300">alex.ai</span>
                </div>

                <div class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" onclick="openStoryModal('google_deepmind', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop')">
                  <div class="story-ring p-0.5 rounded-full">
                    <div class="bg-black p-0.5 rounded-full">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop" class="size-16 rounded-full object-cover">
                    </div>
                  </div>
                  <span class="text-[11px] text-zinc-300">deepmind</span>
                </div>

                <div class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" onclick="openStoryModal('tech_barath', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop')">
                  <div class="story-ring p-0.5 rounded-full">
                    <div class="bg-black p-0.5 rounded-full">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop" class="size-16 rounded-full object-cover">
                    </div>
                  </div>
                  <span class="text-[11px] text-zinc-300">tech_barath</span>
                </div>

                <div class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" onclick="openStoryModal('cyberpunk', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop')">
                  <div class="story-ring p-0.5 rounded-full">
                    <div class="bg-black p-0.5 rounded-full">
                      <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop" class="size-16 rounded-full object-cover">
                    </div>
                  </div>
                  <span class="text-[11px] text-zinc-300">cyberpunk</span>
                </div>
              </div>

              <!-- Instagram Post Card -->
              <article class="border border-zinc-800 rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl">
                <!-- Post Header -->
                <div class="flex items-center justify-between p-3.5">
                  <div class="flex items-center gap-3">
                    <div class="story-ring p-0.5 rounded-full">
                      <div class="bg-black p-0.5 rounded-full">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop" class="size-8 rounded-full object-cover">
                      </div>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-white flex items-center gap-1">
                        barath.dev <i class="fa-solid fa-circle-check text-blue-500 text-[10px]"></i>
                      </p>
                      <p class="text-[10px] text-zinc-400">San Francisco, California</p>
                    </div>
                  </div>
                  <button class="text-zinc-400 hover:text-white p-1">
                    <i class="fa-solid fa-ellipsis"></i>
                  </button>
                </div>

                <!-- Post Photo -->
                <div class="relative aspect-square bg-zinc-900" ondblclick="toggleLike()">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80" class="size-full object-cover" alt="Post Photo">
                </div>

                <!-- Action Bar -->
                <div class="p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4 text-xl">
                      <button onclick="toggleLike()" class="hover:opacity-75 transition">
                        <i id="likeIcon" class="fa-regular fa-heart text-white transition-transform"></i>
                      </button>
                      <button class="hover:opacity-75 transition">
                        <i class="fa-regular fa-comment text-white"></i>
                      </button>
                      <button class="hover:opacity-75 transition">
                        <i class="fa-regular fa-paper-plane text-white"></i>
                      </button>
                    </div>
                    <button class="hover:opacity-75 transition text-xl">
                      <i class="fa-regular fa-bookmark text-white"></i>
                    </button>
                  </div>

                  <!-- Likes Counter -->
                  <p id="likeCount" class="font-bold text-xs text-white">14,291 likes</p>

                  <!-- Caption -->
                  <div class="text-xs text-zinc-200">
                    <span class="font-bold text-white mr-1.5">barath.dev</span>
                    Built the future of AI coding agents today. BARATH.API now connects directly with Cursor, Claude, and Codex with zero manual configuration! 🚀✨
                    <span class="text-blue-400">#antigravity #ai #coding #agents</span>
                  </div>

                  <!-- Comments Container -->
                  <div id="commentList" class="pt-1">
                    <p class="text-[11px] text-zinc-400 cursor-pointer">View all 148 comments</p>
                    <div class="text-xs text-zinc-300 mt-1">
                      <span class="font-semibold text-white mr-1.5">sophia_ai</span> The injector is working 100% seamlessly!
                    </div>
                  </div>

                  <!-- Add Comment Form -->
                  <div class="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                    <input id="commentInput" type="text" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addComment()" class="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none">
                    <button onclick="addComment()" class="text-xs font-bold text-blue-500 hover:text-blue-400">Post</button>
                  </div>
                </div>
              </article>
            </div>

            <!-- Explore View (Hidden initially) -->
            <div id="exploreView" class="hidden">
              <h2 class="text-base font-bold text-white mb-4">Explore Highlights</h2>
              <div class="grid grid-cols-3 gap-2">
                <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
                <img src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop" class="aspect-square object-cover rounded-lg hover:opacity-85 cursor-pointer">
              </div>
            </div>

            <!-- Reels View (Hidden initially) -->
            <div id="reelsView" class="hidden justify-center">
              <div class="max-w-xs w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden relative aspect-9/16 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop" class="size-full object-cover">
                <div class="absolute bottom-4 left-4 right-14 text-white z-10">
                  <p class="font-bold text-sm">@antigravity.tech</p>
                  <p class="text-xs text-zinc-300 mt-1">Autonomous coding subagents running directly in your workspace ⚡</p>
                </div>
                <div class="absolute bottom-4 right-3 flex flex-col items-center gap-4 text-white text-lg z-10">
                  <button class="flex flex-col items-center"><i class="fa-solid fa-heart text-rose-500"></i><span class="text-[10px]">48K</span></button>
                  <button class="flex flex-col items-center"><i class="fa-solid fa-comment"></i><span class="text-[10px]">1.2K</span></button>
                  <button class="flex flex-col items-center"><i class="fa-solid fa-share"></i><span class="text-[10px]">Share</span></button>
                </div>
              </div>
            </div>

            <!-- Messages View (Hidden initially) -->
            <div id="messagesView" class="hidden bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <h2 class="text-base font-bold text-white mb-3">Direct Messages</h2>
              <div class="space-y-3">
                <div class="flex items-center gap-3 p-2.5 hover:bg-zinc-900 rounded-xl cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop" class="size-11 rounded-full object-cover">
                  <div class="flex-1">
                    <p class="text-xs font-bold text-white">Google DeepMind</p>
                    <p class="text-[11px] text-zinc-400">Agent injected successfully • 10m ago</p>
                  </div>
                  <span class="size-2 rounded-full bg-blue-500"></span>
                </div>
                <div class="flex items-center gap-3 p-2.5 hover:bg-zinc-900 rounded-xl cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop" class="size-11 rounded-full object-cover">
                  <div class="flex-1">
                    <p class="text-xs font-bold text-white">Cursor Elite</p>
                    <p class="text-[11px] text-zinc-400">Open with Cursor enabled • 1h ago</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Suggested Profiles Sidebar -->
          <div class="hidden lg:block w-72 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop" class="size-10 rounded-full object-cover">
                <div>
                  <p class="text-xs font-bold text-white">barath.dev</p>
                  <p class="text-[11px] text-zinc-500">Barath K</p>
                </div>
              </div>
              <button class="text-xs font-semibold text-blue-500 hover:text-white">Switch</button>
            </div>

            <div class="flex items-center justify-between text-xs font-bold text-zinc-400 mb-3">
              <span>Suggested for you</span>
              <button class="text-[11px] text-white hover:text-zinc-300">See All</button>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop" class="size-8 rounded-full object-cover">
                  <div>
                    <p class="text-xs font-semibold text-white">claude_ai</p>
                    <p class="text-[10px] text-zinc-500">Suggested for you</p>
                  </div>
                </div>
                <button onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; this.classList.toggle('text-zinc-400')" class="text-xs font-bold text-blue-500">Follow</button>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop" class="size-8 rounded-full object-cover">
                  <div>
                    <p class="text-xs font-semibold text-white">cursor_dev</p>
                    <p class="text-[10px] text-zinc-500">Follows you</p>
                  </div>
                </div>
                <button onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; this.classList.toggle('text-zinc-400')" class="text-xs font-bold text-blue-500">Follow</button>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop" class="size-8 rounded-full object-cover">
                  <div>
                    <p class="text-xs font-semibold text-white">codex_agent</p>
                    <p class="text-[10px] text-zinc-500">Suggested for you</p>
                  </div>
                </div>
                <button onclick="this.textContent = this.textContent === 'Follow' ? 'Following' : 'Follow'; this.classList.toggle('text-zinc-400')" class="text-xs font-bold text-blue-500">Follow</button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- Story Modal -->
      <div id="storyModal" class="fixed inset-0 bg-black/95 z-50 hidden items-center justify-center p-4">
        <button onclick="closeStoryModal()" class="absolute top-6 right-6 text-white text-2xl p-2"><i class="fa-solid fa-xmark"></i></button>
        <div class="max-w-sm w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
          <div class="h-1 bg-zinc-800 w-full">
            <div id="storyProgress" class="h-full bg-white transition-all duration-3000"></div>
          </div>
          <div class="p-3.5 flex items-center gap-3">
            <div class="story-ring p-0.5 rounded-full">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop" class="size-7 rounded-full object-cover">
            </div>
            <span id="storyUsername" class="text-xs font-bold text-white">username</span>
            <span class="text-[10px] text-zinc-400">12m ago</span>
          </div>
          <img id="storyImage" src="" class="aspect-9/16 w-full object-cover">
        </div>
      </div>
    `,
    files: [],
  },
  whatsapp: {
    title: 'WhatsApp Web - Ultra Realistic',
    description: 'WhatsApp Web clone with real-time chat, search filtering, message composer with auto-reply, audio call modal, and online indicators.',
    css: `
      .wa-bg { background-color: #0c1317; }
      .wa-sidebar { background-color: #111b21; }
      .wa-chat-bg { background-color: #0b141a; background-image: radial-gradient(#202c33 1px, transparent 1px); background-size: 20px 20px; }
      .wa-green { background-color: #00a884; }
      .wa-bubble-in { background-color: #202c33; }
      .wa-bubble-out { background-color: #005c4b; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `,
    js: `
      let activeContact = 'Google DeepMind AI';

      function selectContact(name, avatarUrl, statusText) {
        activeContact = name;
        document.getElementById('currentContactName').textContent = name;
        document.getElementById('currentContactAvatar').src = avatarUrl;
        document.getElementById('currentContactStatus').textContent = statusText || 'online';
        
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('bg-zinc-800/80'));
        event.currentTarget.classList.add('bg-zinc-800/80');
      }

      function filterChats(query) {
        const q = query.toLowerCase();
        document.querySelectorAll('.contact-item').forEach(item => {
          const name = item.querySelector('.contact-name').textContent.toLowerCase();
          const lastMsg = item.querySelector('.contact-msg').textContent.toLowerCase();
          if (name.includes(q) || lastMsg.includes(q)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
          }
        });
      }

      function sendWhatsAppMessage() {
        const input = document.getElementById('msgInput');
        const text = input.value.trim();
        if (!text) return;

        const container = document.getElementById('messageStream');
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Add user outgoing message
        const outBubble = document.createElement('div');
        outBubble.className = 'flex justify-end mb-2.5';
        outBubble.innerHTML = \`
          <div class="wa-bubble-out text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-md shadow-md">
            <p>\${text}</p>
            <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200">
              <span>\${timeStr}</span>
              <i class="fa-solid fa-check-double text-sky-400"></i>
            </div>
          </div>
        \`;
        container.appendChild(outBubble);
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // Auto simulated response
        setTimeout(() => {
          const inBubble = document.createElement('div');
          inBubble.className = 'flex justify-start mb-2.5';
          inBubble.innerHTML = \`
            <div class="wa-bubble-in text-white text-xs px-3.5 py-2 rounded-2xl rounded-tl-xs max-w-md shadow-md">
              <p>Awesome! Your message was processed instantly by Antigravity and BARATH.API.</p>
              <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-400">
                <span>\${timeStr}</span>
              </div>
            </div>
          \`;
          container.appendChild(inBubble);
          container.scrollTop = container.scrollHeight;
        }, 1200);
      }

      function triggerCallModal(type) {
        alert(type === 'video' ? 'Starting encrypted video call with ' + activeContact + '...' : 'Starting voice call with ' + activeContact + '...');
      }
    `,
    html: `
      <div class="h-screen flex wa-bg text-zinc-100 overflow-hidden font-sans">
        <!-- Left Contacts Sidebar -->
        <aside class="w-80 md:w-96 wa-sidebar border-r border-zinc-800 flex flex-col shrink-0">
          <!-- User Profile Header -->
          <header class="p-3.5 bg-[#202c33] flex items-center justify-between border-b border-zinc-800">
            <div class="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop" class="size-10 rounded-full object-cover">
              <span class="text-sm font-semibold text-white">Barath K</span>
            </div>
            <div class="flex items-center gap-4 text-zinc-400 text-base">
              <button class="hover:text-white"><i class="fa-solid fa-circle-notch"></i></button>
              <button class="hover:text-white"><i class="fa-solid fa-message"></i></button>
              <button class="hover:text-white"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            </div>
          </header>

          <!-- Search Bar -->
          <div class="p-2.5 bg-[#111b21] border-b border-zinc-800">
            <div class="flex items-center bg-[#202c33] rounded-lg px-3 py-1.5 text-xs text-zinc-400">
              <i class="fa-solid fa-magnifying-glass mr-2.5"></i>
              <input type="text" placeholder="Search or start new chat" oninput="filterChats(this.value)" class="w-full bg-transparent text-white focus:outline-none placeholder-zinc-500">
            </div>
            <!-- Filter Chips -->
            <div class="flex items-center gap-2 mt-2 px-1 text-xs">
              <button class="px-3 py-1 rounded-full wa-green text-black font-semibold text-[11px]">All</button>
              <button class="px-3 py-1 rounded-full bg-[#202c33] text-zinc-300 hover:bg-zinc-700 font-semibold text-[11px]">Unread</button>
              <button class="px-3 py-1 rounded-full bg-[#202c33] text-zinc-300 hover:bg-zinc-700 font-semibold text-[11px]">Groups</button>
            </div>
          </div>

          <!-- Chats List -->
          <div class="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-800/50">
            <!-- Chat 1 -->
            <div class="contact-item flex items-center gap-3.5 p-3 hover:bg-[#202c33] cursor-pointer bg-zinc-800/80 transition" onclick="selectContact('Google DeepMind AI', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop', 'online')">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop" class="size-12 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="contact-name font-semibold text-sm text-white truncate">Google DeepMind AI</h4>
                  <span class="text-[11px] text-zinc-400">10:42 AM</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <p class="contact-msg text-xs text-zinc-400 truncate">BARATH.API Unified router connected with 34 providers.</p>
                  <span class="size-5 rounded-full wa-green text-black text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                </div>
              </div>
            </div>

            <!-- Chat 2 -->
            <div class="contact-item flex items-center gap-3.5 p-3 hover:bg-[#202c33] cursor-pointer transition" onclick="selectContact('Antigravity Elite Team', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop', 'online')">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop" class="size-12 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="contact-name font-semibold text-sm text-white truncate">Antigravity Elite Team</h4>
                  <span class="text-[11px] text-zinc-400">Yesterday</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <p class="contact-msg text-xs text-zinc-400 truncate"><i class="fa-solid fa-check-double text-sky-400 mr-1"></i> Claude & Cursor injection complete!</p>
                </div>
              </div>
            </div>

            <!-- Chat 3 -->
            <div class="contact-item flex items-center gap-3.5 p-3 hover:bg-[#202c33] cursor-pointer transition" onclick="selectContact('Sarah (Lead UX)', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop', 'typing...')">
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop" class="size-12 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="contact-name font-semibold text-sm text-white truncate">Sarah (Lead UX)</h4>
                  <span class="text-[11px] text-zinc-400">Wednesday</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <p class="contact-msg text-xs text-emerald-400 truncate">typing...</p>
                </div>
              </div>
            </div>

            <!-- Chat 4 -->
            <div class="contact-item flex items-center gap-3.5 p-3 hover:bg-[#202c33] cursor-pointer transition" onclick="selectContact('Codex Automation Lab', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop', 'last seen today at 09:15')">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop" class="size-12 rounded-full object-cover">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="contact-name font-semibold text-sm text-white truncate">Codex Automation Lab</h4>
                  <span class="text-[11px] text-zinc-400">Monday</span>
                </div>
                <div class="flex items-center justify-between mt-1">
                  <p class="contact-msg text-xs text-zinc-400 truncate"><i class="fa-solid fa-check-double text-zinc-500 mr-1"></i> Build verification green.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Main Chat Window -->
        <main class="flex-1 flex flex-col wa-chat-bg">
          <!-- Active Contact Header -->
          <header class="p-3 bg-[#202c33] border-b border-zinc-800 flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3.5">
              <img id="currentContactAvatar" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop" class="size-10 rounded-full object-cover">
              <div>
                <h3 id="currentContactName" class="font-semibold text-sm text-white">Google DeepMind AI</h3>
                <p id="currentContactStatus" class="text-xs text-emerald-400">online</p>
              </div>
            </div>
            <div class="flex items-center gap-5 text-zinc-400 text-base pr-2">
              <button onclick="triggerCallModal('video')" class="hover:text-white transition"><i class="fa-solid fa-video"></i></button>
              <button onclick="triggerCallModal('voice')" class="hover:text-white transition"><i class="fa-solid fa-phone"></i></button>
              <button class="hover:text-white transition"><i class="fa-solid fa-magnifying-glass"></i></button>
              <button class="hover:text-white transition"><i class="fa-solid fa-ellipsis-vertical"></i></button>
            </div>
          </header>

          <!-- Message Stream Area -->
          <div id="messageStream" class="flex-1 p-4 md:p-6 overflow-y-auto space-y-3">
            <!-- Encryption Notice -->
            <div class="flex justify-center">
              <span class="bg-[#182229] border border-zinc-800 text-amber-300 text-[11px] px-3.5 py-1.5 rounded-lg shadow-sm text-center max-w-md">
                <i class="fa-solid fa-lock text-xs mr-1"></i> Messages are end-to-end encrypted. No one outside of this chat can read them.
              </span>
            </div>

            <!-- Date badge -->
            <div class="flex justify-center my-2">
              <span class="bg-[#182229] text-zinc-400 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md">Today</span>
            </div>

            <!-- Incoming bubble -->
            <div class="flex justify-start">
              <div class="wa-bubble-in text-white text-xs px-3.5 py-2 rounded-2xl rounded-tl-xs max-w-md shadow-md">
                <p>Welcome to WhatsApp Web on BARATH.API Studio! The agent injector for Claude, Cursor, and Codex is ready to deploy.</p>
                <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-400">
                  <span>10:35 AM</span>
                </div>
              </div>
            </div>

            <!-- Outgoing bubble -->
            <div class="flex justify-end">
              <div class="wa-bubble-out text-white text-xs px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-md shadow-md">
                <p>Yes, all options are set to 100%! Unlimited AI coding is now active.</p>
                <div class="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200">
                  <span>10:36 AM</span>
                  <i class="fa-solid fa-check-double text-sky-400"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Message Composer -->
          <footer class="p-3 bg-[#202c33] border-t border-zinc-800 flex items-center gap-3">
            <button class="text-zinc-400 hover:text-white text-lg p-1 transition"><i class="fa-regular fa-face-smile"></i></button>
            <button class="text-zinc-400 hover:text-white text-lg p-1 transition"><i class="fa-solid fa-paperclip"></i></button>
            <div class="flex-1 bg-[#2a3942] rounded-xl px-4 py-2.5">
              <input id="msgInput" type="text" placeholder="Type a message" onkeydown="if(event.key==='Enter') sendWhatsAppMessage()" class="w-full bg-transparent text-xs text-white focus:outline-none placeholder-zinc-400">
            </div>
            <button onclick="sendWhatsAppMessage()" class="size-10 rounded-full wa-green text-black flex items-center justify-center text-sm shadow-md hover:scale-105 transition">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </footer>
        </main>
      </div>
    `,
    files: [],
  },
  launchpad: {
    title: 'Google AI Studio & Antigravity Web Launchpad',
    description: 'Instant workspace launchpad with interactive preset templates and instruction guide.',
    css: ``,
    js: `
      function runPrompt(p) {
        alert("Launching template: " + p);
      }
    `,
    html: `
      <div class="min-h-screen bg-[#0a0a0c] text-white flex flex-col justify-between p-6 md:p-12">
        <div class="max-w-4xl mx-auto w-full">
          <!-- Top Badge -->
          <div class="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs text-indigo-300 font-semibold mb-6">
            <i class="fa-solid fa-sparkles text-indigo-400"></i> Antigravity In-Person & Google AI Studio Ready
          </div>

          <!-- Hero Heading -->
          <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-linear-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            What would you like to build today?
          </h1>
          <p class="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed mb-8">
            BARATH.API Studio delivers full-featured, interactive modern web apps with zero configuration errors. Choose an application below or type your custom instruction.
          </p>

          <!-- Quick Launch App Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div class="bg-zinc-900/80 border border-zinc-800 hover:border-rose-500/50 p-5 rounded-2xl cursor-pointer transition shadow-xl group">
              <div class="flex items-center gap-3.5 mb-3">
                <div class="size-10 rounded-xl bg-linear-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg">
                  <i class="fa-brands fa-instagram"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-white group-hover:text-rose-400 transition">Instagram Clone</h3>
                  <p class="text-xs text-zinc-400">Stories, interactive likes, explore grid & reels</p>
                </div>
              </div>
            </div>

            <div class="bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 p-5 rounded-2xl cursor-pointer transition shadow-xl group">
              <div class="flex items-center gap-3.5 mb-3">
                <div class="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-lg">
                  <i class="fa-brands fa-whatsapp"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-white group-hover:text-emerald-400 transition">WhatsApp Web Clone</h3>
                  <p class="text-xs text-zinc-400">Real-time chats, blue ticks, search & composer</p>
                </div>
              </div>
            </div>

            <div class="bg-zinc-900/80 border border-zinc-800 hover:border-red-500/50 p-5 rounded-2xl cursor-pointer transition shadow-xl group">
              <div class="flex items-center gap-3.5 mb-3">
                <div class="size-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-lg shadow-lg">
                  <i class="fa-brands fa-youtube"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-white group-hover:text-red-400 transition">YouTube Ultra Modern</h3>
                  <p class="text-xs text-zinc-400">Video player modal, filter chips & dark feed</p>
                </div>
              </div>
            </div>

            <div class="bg-zinc-900/80 border border-zinc-800 hover:border-indigo-500/50 p-5 rounded-2xl cursor-pointer transition shadow-xl group">
              <div class="flex items-center gap-3.5 mb-3">
                <div class="size-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg shadow-lg">
                  <i class="fa-solid fa-chart-line"></i>
                </div>
                <div>
                  <h3 class="font-bold text-base text-white group-hover:text-indigo-400 transition">SaaS Analytics & Cloud</h3>
                  <p class="text-xs text-zinc-400">KPI cards, revenue graph & provider health</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Agent Integration Callout -->
          <div class="bg-linear-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-robot text-indigo-400 text-2xl"></i>
              <div>
                <h4 class="text-sm font-bold text-white">Coding Agent Injector Active</h4>
                <p class="text-xs text-indigo-200/70">Connect Claude Code, Cursor, and Codex directly without manual configuration.</p>
              </div>
            </div>
            <span class="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              100% Injected & Unlimited
            </span>
          </div>
        </div>
      </div>
    `,
    files: [],
  },
};

