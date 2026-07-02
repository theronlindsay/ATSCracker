<script lang="ts">
	import { enhance } from '$app/forms';
	import { Lock, ArrowRight, Loader2 } from '@lucide/svelte';

	let loading = $state(false);
	let error = $state('');

	let { form } = $props();

	$effect(() => {
		if (form?.incorrect) {
			error = 'Incorrect password.';
			loading = false;
		}
		if (form?.missing) {
			error = 'Password is required.';
			loading = false;
		}
	});
</script>

<div class="login-container">
	<div class="login-card animate-slideIn">
		<div class="logo-area">
			<div class="logo-icon">
				<Lock size={28} color="white" />
			</div>
			<h1>Resume Tailor</h1>
			<p>Enter your master password to continue</p>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				error = '';
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
			class="login-form"
		>
			<div class="input-group">
				<input
					type="password"
					name="password"
					placeholder="••••••••••••••••"
					required
					disabled={loading}
				/>
			</div>

			{#if error}
				<p class="error-msg">{error}</p>
			{/if}

			<button type="submit" disabled={loading} class:loading>
				{#if loading}
					<Loader2 class="spinner" size={20} />
					<span>Authenticating...</span>
				{:else}
					<span>Unlock Vault</span>
					<ArrowRight size={18} />
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%);
	}

	.login-card {
		background-color: var(--bg-tertiary);
		padding: 3rem;
		border-radius: calc(var(--radius) * 1.5);
		width: 100%;
		max-width: 440px;
		box-shadow:
			var(--shadow-glow),
			0 25px 50px -12px rgba(0, 0, 0, 0.5);
		border: 1px solid var(--border-color);
		position: relative;
		overflow: hidden;
	}

	.login-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: var(--accent-gradient);
	}

	.logo-area {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.logo-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--accent-gradient);
		margin-bottom: 1rem;
		box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
	}

	h1 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-group input {
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: var(--radius);
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		font-size: 1rem;
		outline: none;
		transition: all 0.2s ease;
	}

	.input-group input:focus {
		border-color: var(--accent-solid);
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
	}

	.input-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-msg {
		color: #ef4444; /* red-500 */
		font-size: 0.875rem;
		text-align: center;
		margin-top: -0.5rem;
	}

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
		border-radius: var(--radius);
		background: var(--accent-gradient);
		color: white;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
	}

	button:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
	}

	button:active:not(:disabled) {
		transform: translateY(0);
	}

	button:disabled {
		opacity: 0.8;
		cursor: wait;
	}

	button.loading {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		box-shadow: none;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
