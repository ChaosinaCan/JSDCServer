using System;
using System.Threading.Tasks;
using System.Windows;

namespace JSDC
{
	/// <summary>
	/// Extension methods for various classes
	/// </summary>
	public static class Extensions
	{
		/// <summary>
		/// Runs a function on the UI thread
		/// </summary>
		/// <param name="obj"></param>
		/// <param name="action">The function to run</param>
		public static void RunOnUIThread(this DependencyObject obj, Action action)
		{
			if (obj.Dispatcher.CheckAccess())
			{
				// If we are already on the UI thread, just run the function
				action();
			}
			else
			{
				obj.Dispatcher.BeginInvoke(action, null);
			}
		}

		/// <summary>
		/// Runs a function on the UI thread
		/// </summary>
		/// <param name="obj"></param>
		/// <param name="action">The function to run</param>
		/// <returns></returns>
		public static async Task RunOnUIThreadAsync(this DependencyObject obj, Action action)
		{
			if (obj.Dispatcher.CheckAccess())
			{
				// If we are already on the UI thread, just run the function
				action();
			}
			else
			{
				await obj.Dispatcher.BeginInvoke(action, null);
			}
		}

		/// <summary>
		/// Runs a function on the UI thread and gets its return value
		/// </summary>
		/// <typeparam name="T"></typeparam>
		/// <param name="obj"></param>
		/// <param name="action"></param>
		/// <returns></returns>
		public static async Task<T> RunOnUIThreadAsync<T>(this DependencyObject obj, Func<T> action)
		{
			T result;

			if (obj.Dispatcher.CheckAccess())
			{
				// If we are already on the UI thread, just run the function
				result = action();
			}
			else
			{
				result = await obj.Dispatcher.InvokeAsync(action);
			}

			return result;
		}
	}
}