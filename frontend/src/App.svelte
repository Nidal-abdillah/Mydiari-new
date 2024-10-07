<script>
	import { onMount } from 'svelte';
  
	let entries = [];
	let title = '';
	let content = '';
	let editingId = null;
  
	const API_URL = 'http://192.168.7.76:3000';
  
	onMount(async () => {
	  await fetchEntries();
	});
  
	async function fetchEntries() {
	  const response = await fetch(`${API_URL}/entries`);
	  entries = await response.json();
	}
  
	async function handleSubmit() {
	  const method = editingId ? 'PUT' : 'POST';
	  const url = editingId ? `${API_URL}/entries/${editingId}` : `${API_URL}/entries`;
  
	  const response = await fetch(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title, content })
	  });
  
	  if (response.ok) {
		await fetchEntries();
		title = '';
		content = '';
		editingId = null;
	  }
	}
  
	function editEntry(entry) {
	  title = entry.title;
	  content = entry.content;
	  editingId = entry.id;
	}
  
	async function deleteEntry(id) {
	  const response = await fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' });
	  if (response.ok) {
		await fetchEntries();
	  }
	}
  </script>
  
  <main class="container mt-4">
	<h1 class="mb-4">MyDiary</h1>
	
	<form on:submit|preventDefault={handleSubmit} class="mb-4">
	  <div class="mb-3">
		<input bind:value={title} class="form-control" placeholder="Title" required>
	  </div>
	  <div class="mb-3">
		<textarea bind:value={content} class="form-control" placeholder="Content" required rows="4"></textarea>
	  </div>
	  <button type="submit" class="btn btn-primary">{editingId ? 'Update' : 'Add'} Entry</button>
	</form>
  
	<h2>Entries</h2>
	{#each entries as entry}
	  <div class="card mb-3">
		<div class="card-body">
		  <h5 class="card-title">{entry.title}</h5>
		  <p class="card-text">{entry.content}</p>
		  <p class="card-text"><small class="text-muted">Date: {new Date(entry.date).toLocaleString()}</small></p>
		  <button class="btn btn-warning me-2" on:click={() => editEntry(entry)}>Edit</button>
		  <button class="btn btn-danger" on:click={() => deleteEntry(entry.id)}>Delete</button>
		</div>
	  </div>
	{/each}
  </main>
  
  <style>
	/* Additional custom styles (if needed) */
  </style>
  