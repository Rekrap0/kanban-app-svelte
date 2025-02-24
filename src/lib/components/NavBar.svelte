<script>
  import { page } from '$app/stores';
  
  // Compute whether we're on the board or list page
  $: currentPath = $page.url.pathname;
  $: isBoard = currentPath === '/boards';
  $: isList = currentPath === '/list';
</script>
<h1 class="text-3xl text-black font-bold">Dashboard</h1>
<div class="flex gap-8 mb-5 mt-5">
  <a 
    href="/boards"
    class="text-xl text-gray-800 hover:text-gray-600 transition-colors"
    class:font-bold={isBoard}
  >
    My Boards
  </a>
  
  <a 
    href="/list"
    class="text-xl text-gray-800 hover:text-gray-600 transition-colors"
    class:font-bold={isList}
  >
    My Notes
  </a>
</div>