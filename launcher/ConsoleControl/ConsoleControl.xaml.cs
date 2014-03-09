using ConsoleControlAPI;
using System;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;

// From https://github.com/dwmkerr/consolecontrol

namespace JSDC.ConsoleControl.WPF
{
	/// <summary>
	/// Interaction logic for ConsoleControl.xaml
	/// </summary>
	public partial class ConsoleControl : UserControl
	{
		/// <summary>
		/// Initializes a new instance of the <see cref="ConsoleControl"/> class.
		/// </summary>
		public ConsoleControl()
		{
			InitializeComponent();

			//  Handle process events.
			processInterace.OnProcessOutput += processInterface_OnProcessOutput;
			processInterace.OnProcessError += processInterface_OnProcessError;
			processInterace.OnProcessInput += processInterface_OnProcessInput;
			processInterace.OnProcessExit += processInterface_OnProcessExit;

			//  Wait for key down messages on the rich text box.
			richTextBoxConsole.KeyDown += richTextBoxConsole_KeyDown;
		}

		/// <summary>
		/// Handles the OnProcessError event of the processInterace control.
		/// </summary>
		/// <param name="sender">The source of the event.</param>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void processInterface_OnProcessError(object sender, ProcessEventArgs args)
		{
			this.RunOnUIThread(() =>
			{
				//  Write the output, in red
				WriteOutput(args.Content, Colors.Red);

				//  Fire the output event.
				FireProcessOutputEvent(args);
			});
		}

		/// <summary>
		/// Handles the OnProcessOutput event of the processInterace control.
		/// </summary>
		/// <param name="sender">The source of the event.</param>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void processInterface_OnProcessOutput(object sender, ProcessEventArgs args)
		{
			this.RunOnUIThread(() =>
			{
				//  Write the output, in white
				WriteOutput(args.Content, richTextBoxConsole.Foreground);

				//  Fire the output event.
				FireProcessOutputEvent(args);
			});
		}

		/// <summary>
		/// Handles the OnProcessInput event of the processInterace control.
		/// </summary>
		/// <param name="sender">The source of the event.</param>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void processInterface_OnProcessInput(object sender, ProcessEventArgs args)
		{
			this.RunOnUIThread(() => FireProcessInputEvent(args));
		}

		/// <summary>
		/// Handles the OnProcessExit event of the processInterace control.
		/// </summary>
		/// <param name="sender">The source of the event.</param>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void processInterface_OnProcessExit(object sender, ProcessEventArgs args)
		{
			this.RunOnUIThread(() =>
			{
				//  Are we showing diagnostics?
				if (ShowDiagnostics)
				{
					WriteOutput(Environment.NewLine + processInterace.ProcessFileName + " exited.", Color.FromArgb(255, 0, 255, 0));
				}

				//  Read only again.{
				richTextBoxConsole.IsReadOnly = true;

				//  And we're no longer running.
				IsProcessRunning = false;
			});
		}

		/// <summary>
		/// Handles the KeyDown event of the richTextBoxConsole control.
		/// </summary>
		/// <param name="sender">The source of the event.</param>
		/// <param name="e">The <see cref="System.Windows.Input.KeyEventArgs" /> instance containing the event data.</param>
		private void richTextBoxConsole_KeyDown(object sender, KeyEventArgs e)
		{
			bool inReadOnlyZone = richTextBoxConsole.Selection.Start.CompareTo(inputStart) < 0;

			//  If we're at the input point and it's backspace, bail.
			if (inReadOnlyZone && e.Key == Key.Back)
				e.Handled = true;

			//  Are we in the read-only zone?
			if (inReadOnlyZone)
			{
				//  Allow arrows and Ctrl-C.
				if (!(e.Key == Key.Left ||
					e.Key == Key.Right ||
					e.Key == Key.Up ||
					e.Key == Key.Down ||
					(e.Key == Key.C && Keyboard.Modifiers.HasFlag(ModifierKeys.Control))))
				{
					e.Handled = true;
				}
			}

			//  Is it the return key?
			if (e.Key == Key.Return)
			{
				//  Get the input.
				//todostring input = richTextBoxConsole.Text.Substring(inputStart, (richTextBoxConsole.SelectionStart) - inputStart);

				//  Write the input (without echoing).
				//todoWriteInput(input);
			}
		}

		/// <summary>
		/// Writes the output to the console control.
		/// </summary>
		/// <param name="output">The output.</param>
		/// <param name="color">The color.</param>
		public void WriteOutput(string output, Color color)
		{
			WriteOutput(output, new SolidColorBrush(color));
		}

		/// <summary>
		/// Writes the output to the console control.
		/// </summary>
		/// <param name="output">The output.</param>
		/// <param name="brush">The color.</param>
		public void WriteOutput(string output, Brush brush)
		{
			if (string.IsNullOrEmpty(lastInput) == false &&
				(output == lastInput || output.Replace("\r\n", "") == lastInput))
				return;

			this.RunOnUIThread(() =>
				{
					//  Write the output.
					if (TextColorizer != null)
					{
						foreach (var chunk in TextColorizer.Colorize(output, brush))
						{
							AppendText(chunk.Item1, chunk.Item2);
						}
					}
					else
					{
						AppendText(output, brush);
					}

					inputStart = richTextBoxConsole.Selection.Start;

					richTextBoxConsole.ScrollToEnd();
				});
		}

		/// <summary>
		/// Clears the output.
		/// </summary>
		public void ClearOutput()
		{
			richTextBoxConsole.Document.Blocks.Clear();
			inputStart = null;
		}

		public void WriteInput(string input, bool echo = false)
		{
			WriteInput(input, echo, richTextBoxConsole.Foreground);
		}

		public void WriteInput(string input, bool echo, Color color)
		{
			WriteInput(input, echo, new SolidColorBrush(color));
		}

		/// <summary>
		/// Writes the input to the console control.
		/// </summary>
		/// <param name="input">The input.</param>
		/// <param name="color">The color.</param>
		/// <param name="echo">if set to <c>true</c> echo the input.</param>
		public void WriteInput(string input, bool echo, Brush brush)
		{
			this.RunOnUIThread(() =>
				{
					//  Are we echoing?
					if (echo)
					{
						AppendText("> " + input, brush);
						inputStart = richTextBoxConsole.Selection.Start;
					}

					lastInput = input;

					//  Write the input.
					processInterace.WriteInput(input);

					//  Fire the event.
					FireProcessInputEvent(new ProcessEventArgs(input));
				});
		}

		/// <summary>
		/// Runs a process.
		/// </summary>
		/// <param name="fileName">Name of the file.</param>
		/// <param name="arguments">The arguments.</param>
		public Process StartProcess(string fileName, string arguments)
		{
			this.RunOnUIThread(() =>
			{
				//  Are we showing diagnostics?
				if (ShowDiagnostics)
				{
					WriteOutput("Preparing to run " + fileName, Color.FromArgb(255, 0, 255, 0));
					if (!string.IsNullOrEmpty(arguments))
						WriteOutput(" with arguments " + arguments + "." + Environment.NewLine, Color.FromArgb(255, 0, 255, 0));
					else
						WriteOutput("." + Environment.NewLine, Color.FromArgb(255, 0, 255, 0));
				}
			});

			//  Start the process.
			var process = processInterace.StartProcess(fileName, arguments);

			this.RunOnUIThread(() =>
			{
				IsProcessRunning = true;
			});

			return process;
		}

		/// <summary>
		/// Runs a process.
		/// </summary>
		/// <param name="processStartInfo"></param>
		/// <returns></returns>
		public Process StartProcess(ProcessStartInfo processStartInfo)
		{
			this.RunOnUIThread(() =>
			{
				//  Are we showing diagnostics?
				if (ShowDiagnostics)
				{
					WriteOutput("Preparing to run " + processStartInfo.FileName, Color.FromArgb(255, 0, 255, 0));
					if (!string.IsNullOrEmpty(processStartInfo.Arguments))
						WriteOutput(" with arguments " + processStartInfo.Arguments + "." + Environment.NewLine, Color.FromArgb(255, 0, 255, 0));
					else
						WriteOutput("." + Environment.NewLine, Color.FromArgb(255, 0, 255, 0));
				}
			});

			//  Start the process.
			var process = processInterace.StartProcess(processStartInfo);

			this.RunOnUIThread(() =>
			{
				IsProcessRunning = true;
			});

			return process;
		}

		/// <summary>
		/// Stops the process.
		/// </summary>
		public void StopProcess()
		{
			//  Stop the interface.
			processInterace.StopProcess();
		}

		/// <summary>
		/// Fires the console output event.
		/// </summary>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void FireProcessOutputEvent(ProcessEventArgs args)
		{
			//  Get the event.
			var theEvent = OnProcessOutput;
			if (theEvent != null)
				theEvent(this, args);
		}

		/// <summary>
		/// Fires the console input event.
		/// </summary>
		/// <param name="args">The <see cref="ProcessEventArgs"/> instance containing the event data.</param>
		private void FireProcessInputEvent(ProcessEventArgs args)
		{
			//  Get the event.
			var theEvent = OnProcessInput;
			if (theEvent != null)
				theEvent(this, args);
		}

		private void AppendText(string text, Brush brush)
		{
			var tr = new TextRange(richTextBoxConsole.Document.ContentEnd, richTextBoxConsole.Document.ContentEnd);
			tr.Text = text;
			tr.ApplyPropertyValue(TextElement.ForegroundProperty, brush);
		}

		/// <summary>
		/// The internal process interface used to interface with the process.
		/// </summary>
		private readonly ProcessInterface processInterace = new ProcessInterface();

		/// <summary>
		/// Current position that input starts at.
		/// </summary>
		private TextPointer inputStart;

		/// <summary>
		/// The last input string (used so that we can make sure we don't echo input twice).
		/// </summary>
		private string lastInput;

		/// <summary>
		/// Occurs when console output is produced.
		/// </summary>
		public event ProcessEventHandler OnProcessOutput;

		/// <summary>
		/// Occurs when console input is produced.
		/// </summary>
		public event ProcessEventHandler OnProcessInput;

		private static readonly DependencyProperty ShowDiagnosticsProperty =
		  DependencyProperty.Register("ShowDiagnostics", typeof(bool), typeof(ConsoleControl),
		  new PropertyMetadata(false, OnShowDiagnosticsChanged));

		public ITextColorizer TextColorizer
		{
			get { return (ITextColorizer)GetValue(TextColorizerProperty); }
			set { SetValue(TextColorizerProperty, value); }
		}

		// Using a DependencyProperty as the backing store for TextColorizer.  This enables animation, styling, binding, etc...
		public static readonly DependencyProperty TextColorizerProperty =
			DependencyProperty.Register("TextColorizer", typeof(ITextColorizer), typeof(ConsoleControl), new PropertyMetadata(null));

		/// <summary>
		/// Gets or sets a value indicating whether to show diagnostics.
		/// </summary>
		/// <value>
		///   <c>true</c> if show diagnostics; otherwise, <c>false</c>.
		/// </value>
		public bool ShowDiagnostics
		{
			get { return (bool)GetValue(ShowDiagnosticsProperty); }
			set { SetValue(ShowDiagnosticsProperty, value); }
		}

		private static void OnShowDiagnosticsChanged(DependencyObject o, DependencyPropertyChangedEventArgs args)
		{
		}

		private static readonly DependencyProperty IsInputEnabledProperty =
		  DependencyProperty.Register("IsInputEnabled", typeof(bool), typeof(ConsoleControl),
		  new PropertyMetadata(true));

		/// <summary>
		/// Gets or sets a value indicating whether this instance has input enabled.
		/// </summary>
		/// <value>
		/// <c>true</c> if this instance has input enabled; otherwise, <c>false</c>.
		/// </value>
		public bool IsInputEnabled
		{
			get { return (bool)GetValue(IsInputEnabledProperty); }
			set { SetValue(IsInputEnabledProperty, value); }
		}

		internal static readonly DependencyPropertyKey IsProcessRunningPropertyKey =
		  DependencyProperty.RegisterReadOnly("IsProcessRunning", typeof(bool), typeof(ConsoleControl),
		  new PropertyMetadata(false));

		private static readonly DependencyProperty IsProcessRunningProperty = IsProcessRunningPropertyKey.DependencyProperty;

		/// <summary>
		/// Gets a value indicating whether this instance has a process running.
		/// </summary>
		/// <value>
		/// <c>true</c> if this instance has a process running; otherwise, <c>false</c>.
		/// </value>
		public bool IsProcessRunning
		{
			get { return (bool)GetValue(IsProcessRunningProperty); }
			private set { SetValue(IsProcessRunningPropertyKey, value); }
		}
	}
}
