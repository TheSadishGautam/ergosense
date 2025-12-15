# ErgoSense

Welcome to the official **ErgoSense** Releases repository! This is your destination for downloading the latest builds of **Your Personal AI-Powered Ergonomics Assistant** across all major platforms.

**Tagline:** Master Your Posture. Protect Your Vision. Boost Your Focus.

Whether you're a remote worker, software developer, digital creative, or anyone who spends hours in front of a computer, this repository provides easy access to the latest ErgoSense builds optimized for macOS, Windows, and Linux.

## Overview

ErgoSense serves as the primary distribution channel for stable and tested versions of the ErgoSense desktop application. Rather than compiling from source code, users can directly download pre-built binaries optimized for their specific platform. This approach ensures faster deployment, reduced setup complexity, and guaranteed compatibility across different systems.

The repository is meticulously maintained to provide clean, organized, and easily accessible releases. Each build is carefully prepared and tested before being made available for public download, ensuring that users receive high-quality, production-ready software.

## About ErgoSense

**ErgoSense** is your personal AI-powered ergonomics assistant that uses advanced local AI to monitor your ergonomics in real-time, helping you stay healthy and productive without ever compromising your privacy. The application runs quietly in the background, acting as your digital health guardian for extended work sessions.

### The Problem ErgoSense Solves

- **The Silent Crisis**: Prolonged sitting and screen time lead to "Tech Neck," chronic back pain, and Computer Vision Syndrome—conditions that develop silently until they cause serious discomfort.
- **The Focus Trap**: We get so absorbed in work that we forget to blink or sit up straight until it hurts, creating a cycle of poor ergonomic habits.
- **The Privacy Concern**: Existing ergonomic solutions often require cloud processing, raising concerns about having a camera pointed at you all day. ErgoSense solves this with 100% local processing.

### 🧘 Real-Time Posture Correction

- **Smart Detection**: Uses computer vision to detect when you slouch or lean too close to the screen.
- **Gentle Nudges**: Sends subtle notifications only when poor posture is sustained (5-minute rolling average), avoiding annoying false alarms.
- **Calibrated Awareness**: Learns your unique neutral spine position during initial setup for personalized monitoring.

### 👁️ Eye Health Protection

- **Blink Rate Monitoring**: Tracks your blink frequency to prevent dry eyes and Computer Vision Syndrome.
- **20-20-20 Rule**: Reminds you to look away every 20 minutes to reduce eye strain and promote visual recovery.
- **Distance Alerts**: Warns you if you're sitting too close to the monitor, preventing unnecessary eye strain.
- **Actionable Insights**: Receive personalized recommendations like "Increase blink rate" or "Take a micro-break."

### 🔒 Privacy-First Design

- **100% Local Processing**: All AI analysis happens directly on your device using TensorFlow/MediaPipe.
- **No Cloud Uploads**: No video feeds or images are ever sent to the cloud. Your data stays yours.
- **Offline Capable**: Works perfectly without an internet connection—true privacy by design.
- **Lightweight Architecture**: Engineered to use less than 5% CPU, ensuring it doesn't slow down your workflow.

### 📊 Insightful Dashboard

- **Ergonomic Score**: A daily composite score (0-100) of your posture and eye health.
- **Trend Analysis**: View hourly, daily, and weekly trends to track your improvement over time.
- **Focus Time**: Track how many hours you've been present and productive.
- **Health Benefits Tracking**: Monitor progress toward better musculoskeletal health and reduced digital eye strain.

### Visit the Official Application

Experience ErgoSense online and explore its full capabilities:

🌐 **[https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/)**

## Repository Contents

ErgoSense contains professionally prepared build files and installers for ErgoSense. All major platforms are now supported:

### Available Platforms

**macOS (Available)**

- macOS 11.0 (Big Sur) and later versions
- Apple Silicon (M1/M2/M3) and Intel architectures
- Standard .dmg disk image format for easy installation
- Optimized for both processor architectures

**Windows (Available)**

- Windows 10 and later versions
- Both 32-bit and 64-bit architectures
- .exe installers and portable versions
- Full feature parity with macOS

**Linux (Available)**

- Support for major Linux distributions including Ubuntu, Debian, Fedora, CentOS, and others
- Both 64-bit (x86-64) and ARM64 architectures
- Available in multiple formats: AppImage, Snap, DEB packages, and RPM packages
- Native support for your favorite Linux distribution

## Why This Repository?

### Easy Download & Installation for All Platforms

This dedicated repository eliminates the need to build from source. Users can directly access production-ready builds without requiring development tools or technical expertise. Whether you're on macOS, Windows, or Linux, just download the appropriate installer and you're ready to go.

### Cross-Platform Consistency

ErgoSense now delivers the same powerful ergonomic monitoring experience across macOS, Windows, and Linux:

- Full feature parity across all platforms
- Consistent user experience regardless of your OS
- Same privacy-first, local AI processing on every platform

### Regular Updates

All major releases and improvements are maintained in this repository, allowing users to:

- Download the latest version with new features and improvements
- Access previous versions if needed
- Review detailed release notes and changelog information
- Stay updated with bug fixes and performance enhancements

### Quality & Privacy Assurance

Every build released through this repository has been tested for:

- Performance optimization and low CPU usage (<5%) across all platforms
- Privacy compliance (100% local processing, no cloud uploads)
- Stability and reliability on your operating system
- Compatibility with supported hardware and OS versions

## How It Works

1. **Install & Launch**: Download the lightweight app for macOS (v0.1.0 available now).
2. **Calibrate**: Sit comfortably and let ErgoSense learn your neutral spine position in seconds.
3. **Work Normally**: The app runs in the background, analyzing video frames locally on your device using AI.
4. **Get Notified**: Receive gentle, non-intrusive alerts when you need to adjust your posture or take a break.
5. **Review Progress**: Check your dashboard to see your ergonomic score, trends, and actionable insights.

## Technical Specifications

- **Current Platform**: macOS (v0.1.0)
- **Upcoming Platforms**: Windows & Linux (coming soon)
- **Architecture**: Electron + React + TypeScript
- **AI Engine**: TensorFlow / MediaPipe (optimized for CPU/GPU)
- **Database**: Local SQLite for secure metric storage
- **Performance**: Ultra-lightweight—uses less than 5% CPU, so it won't slow down your workflow
- **Privacy**: 100% local processing with TensorFlow/MediaPipe—no cloud uploads, no privacy concerns
- **Connectivity**: Works offline perfectly; internet only needed for app updates

## Getting Started

### For macOS Users

#### Step 1: Download ErgoSense

1. Visit the [Releases](../../releases) page
2. Download the latest ErgoSense .dmg file for your architecture:
   - **Apple Silicon** (M1/M2/M3): Download the ARM64 version
   - **Intel Mac**: Download the x86-64 version

#### Step 2: Install the Application

1. Double-click the downloaded .dmg file to mount the disk image
2. A window will open showing the ErgoSense app and Applications folder
3. Drag the **ErgoSense** icon to the **Applications** folder
4. Wait for the copy process to complete
5. Eject the mounted .dmg from the Finder sidebar

#### Step 3: Handle Security Warning (If Prompted)

ErgoSense is not yet signed with an Apple Developer ID, so macOS may block it on first launch. This is normal for early-access software. Follow these steps:

**When you see "App was blocked because it is not from an identified developer":**

1. **Open System Settings**

   - Click the Apple menu (🍎) in the top-left corner
   - Select "System Settings" (or "System Preferences" on older macOS)

2. **Navigate to Security & Privacy**

   - In the left sidebar, click "Privacy & Security"
   - Scroll down to the "Security" section

3. **Allow ErgoSense**

   - You'll see a message: **"App was blocked because it is not from an identified developer"**
   - Click the **"Allow Anyway"** button next to the ErgoSense entry
   - You may be prompted to enter your Mac's password—do so when asked

4. **Launch ErgoSense**
   - Open Applications folder (Cmd + Shift + A)
   - Double-click **ErgoSense**
   - Click **"Open"** when prompted to confirm launching an unverified app

#### Step 4: Grant Camera Access

1. On first launch, macOS will ask for camera access
2. Click **"Allow"** when prompted
3. This permission is necessary for posture and eye health monitoring

#### Step 5: Complete Setup

1. Follow the calibration wizard
2. Sit comfortably and let ErgoSense learn your neutral spine position
3. Start using ErgoSense!

#### About the Unsigned App Notice

**Why is ErgoSense unsigned?**
Apple's code signing and notarization require a registered Developer Account and associated fees. As an early-access project, ErgoSense hasn't been through this process yet. However, the application is completely safe and functional.

**Want to Help?**
If you'd like to contribute to ErgoSense's development—including help with setting up an official Apple Developer account for code signing—please reach out! Contact us through [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/). Your support would help us streamline the installation experience for all users.

### For Windows Users

1. Visit the [Releases](../../releases) page
2. Download the latest ErgoSense .exe installer for your system:
   - **64-bit Windows** (Recommended): Download the x64 version
   - **32-bit Windows**: Download the x86 version
3. Run the installer and follow the on-screen setup wizard
4. Choose your installation directory and desired shortcuts
5. Complete the installation
6. **Important**: Grant camera and microphone permissions when prompted by Windows Security
7. Launch ErgoSense from your Start menu or desktop shortcut
8. Follow the calibration wizard to set up your neutral spine position

### For Linux Users

1. Visit the [Releases](../../releases) page
2. Choose the appropriate package format for your distribution:
   - **Ubuntu/Debian**: Download the .deb package and install using `sudo dpkg -i ergosense.deb`
   - **Fedora/CentOS/RHEL**: Download the .rpm package and install using `sudo rpm -i ergosense.rpm`
   - **Other Distributions**: Download the AppImage for universal compatibility
3. For AppImage: Make it executable with `chmod +x ergosense-*.AppImage` and run it
4. Grant camera access permissions when prompted
5. Launch ErgoSense from your applications menu
6. Follow the calibration wizard to set up your neutral spine position

## System Requirements

### macOS

**Minimum Requirements**

- **OS**: macOS 11.0 (Big Sur) or later
- **Processor**: Apple Silicon (M1/M2/M3) or Intel processor
- **Camera**: Built-in webcam or external USB camera (required for posture detection)
- **RAM**: 4 GB minimum
- **Storage**: 200 MB free disk space

**Recommended Requirements**

- **OS**: macOS 12.0 (Monterey) or later
- **Processor**: Apple M1 Pro or better / Recent Intel processor
- **Camera**: High-resolution webcam (1080p+) for better accuracy
- **RAM**: 8 GB or more
- **Storage**: 500 MB free disk space on SSD

### Windows

**Minimum Requirements**

- **OS**: Windows 10 (Build 19041) or later / Windows 11
- **Processor**: Intel Core i5 or AMD Ryzen 5 (or equivalent)
- **Camera**: Built-in or external USB webcam (required for posture detection)
- **RAM**: 4 GB minimum
- **Storage**: 300 MB free disk space

**Recommended Requirements**

- **OS**: Windows 11
- **Processor**: Intel Core i7 / AMD Ryzen 7 or better
- **Camera**: High-resolution USB camera (1080p+) for better accuracy
- **RAM**: 8 GB or more
- **Storage**: 500 MB free disk space on SSD

### Linux

**Minimum Requirements**

- **OS**: Ubuntu 18.04 LTS, Debian 10, Fedora 30, CentOS 7, or equivalent
- **Processor**: Intel/AMD 64-bit processor with SSE2 support
- **Camera**: Built-in or external USB webcam (required for posture detection)
- **RAM**: 4 GB minimum
- **Storage**: 200 MB free disk space

**Recommended Requirements**

- **OS**: Ubuntu 20.04 LTS or later, Fedora 35+, or latest stable distribution
- **Processor**: Modern 64-bit processor (Intel/AMD)
- **Camera**: High-resolution USB camera (1080p+) for better accuracy
- **RAM**: 8 GB or more
- **Storage**: 500 MB free disk space on SSD
- **Display Server**: X11 or Wayland

## Health Benefits (Backed by Science)

ErgoSense helps you achieve better long-term health outcomes supported by ergonomic research:

- **Reduce Musculoskeletal Disorders**: Proper posture reduces the risk of chronic back and neck pain, preventing "Tech Neck" and related conditions.
- **Prevent Digital Eye Strain**: Regular blinking and eye breaks prevent dry eyes, blurred vision, and headaches associated with Computer Vision Syndrome.
- **Boost Productivity**: Physical comfort is directly linked to mental focus, creativity, and sustained work performance.
- **Long-term Wellness**: Consistent ergonomic habits built over time lead to lasting health improvements and reduced healthcare costs.

## Release Versioning

ErgoSense follows semantic versioning (MAJOR.MINOR.PATCH):

- **v0.x.x**: Early access releases with core features (current phase)
- **MINOR**: New features and enhancements (future updates)
- **PATCH**: Bug fixes, performance improvements, and refinements

Each release includes detailed release notes describing new features, improvements, and fixes.

## Download and Installation Support

### Finding Your Version

- **Current Release**: Latest version with full macOS, Windows, and Linux support
- **Check System Compatibility**: Verify your system meets the requirements for your platform
- **Architecture Check**:
  - **macOS**: Apple Menu → About This Mac
  - **Windows**: Settings → System → About
  - **Linux**: Run `uname -m` in terminal

### Installation Troubleshooting

### Installation Troubleshooting

**macOS**

- **"App was blocked because it is not from an identified developer"**: This is expected for the early-access version. Follow the detailed steps in the macOS installation guide above under "Step 3: Handle Security Warning". Go to System Settings → Privacy & Security and click "Allow Anyway" next to ErgoSense.
- **Camera Access Denied**: Check System Preferences → Security & Privacy → Camera and ensure ErgoSense is listed and enabled
- **App Won't Launch**:
  - Make sure you've allowed it in System Settings first
  - Try moving the app to Applications folder if not already there
  - Ensure macOS 11.0 or later is installed
- **Permission Denied Error**: Right-click the app and select "Open" to manually authorize it
- **Performance Issues**: Close other applications using the camera; test your camera in FaceTime first to ensure it works

**Unsigned App & Developer Account**
If you're interested in helping ErgoSense get properly code-signed and notarized by Apple, we'd love your support! This requires an official Apple Developer Account. If you'd like to contribute or sponsor this effort, please contact us at [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/). Your help would benefit all macOS users!

### Windows Installation

Simply download and run the installer. If Windows SmartScreen warns you, click "More info" and then "Run anyway".

3. Now you can open ErgoSense normally!

> [!IMPORTANT] > **Help Needed: macOS Code Signing**
>
> We are looking for contributors who can help us with the official Apple code signing and notarization process. This requires an Apple Developer Program membership ($99/year). If you would like to sponsor this or help us get signed to remove the "damaged app" warning for everyone, please **[contact us](mailto:ergosense@sadish.com.np)** or open an issue! Your support would be a huge help to the community.

## Local Development

If you want to run ErgoSense locally or contribute to the project, follow these steps:

### Prerequisites

- Node.js (v18+)
- Python 3 (required for building native modules like `better-sqlite3`)
- C++ Build Tools (Xcode Command Line Tools on macOS, Visual Studio Build Tools on Windows)

### Setup

1.  Clone the repository:

    ```bash
    git clone https://github.com/TheSadishGautam/ergosense.git
    cd ergosense
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

    _Note: internal native modules will be compiled during this step._

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Troubleshooting

**Windows**

- **Camera Access Denied**: Check Settings → Privacy & Security → Camera and allow ErgoSense
- **Installation Fails**: Run installer as Administrator (right-click → Run as administrator)
- **Missing Dependencies**: Ensure .NET Framework is installed (usually automatic)
- **Antivirus Interference**: Temporarily disable antivirus during installation if needed

**Linux**

- **Permission Denied**: For .deb/.rpm: ensure you have sudo privileges; for AppImage: run `chmod +x` first
- **Camera Not Detected**: Install camera support: Ubuntu/Debian: `sudo apt install v4l-utils`; Fedora: `sudo dnf install v4l-utils`
- **Missing Libraries**: Some distributions may need: `sudo apt install libssl-dev libx11-dev` (Ubuntu/Debian)
- **Wayland Issues**: If using Wayland, you may need X11 for camera access

**All Platforms**

- **Calibration Problems**: Ensure adequate lighting and a clear view of your face
- **Offline Operation**: ErgoSense works perfectly without internet—just download once and enjoy uninterrupted monitoring

### Getting Help

- Check the documentation included with the release
- Visit [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/) for FAQs and platform-specific guides
- Review release notes for known issues and solutions

## Updates and Future Roadmap

### Staying Current with ErgoSense

- Watch this repository for new releases and improvements
- Review release notes to understand what's new in each update
- Your ergonomic data is stored locally and persists across updates
- Cross-platform synchronization options coming soon

### Upcoming Enhancements

- **Enhanced AI**: Continued improvements to posture detection accuracy across all platforms
- **Expanded Insights**: More detailed health analytics and trend visualization
- **Cloud Sync (Optional)**: Optional secure cloud backup for your ergonomic data
- **Mobile Companion**: Mobile app for viewing stats and insights on the go
- **Integration Options**: Potential integrations with fitness trackers and health platforms
- **Enterprise Features**: Team analytics and workplace ergonomics dashboards

### Feedback & Suggestions

Your feedback helps shape the future of ErgoSense! Share your experience and suggestions through the official website to help us improve across all platforms.

## License and Legal

ErgoSense is distributed under specific license terms. Please review the LICENSE file included in the repository for complete information regarding usage rights, restrictions, and legal obligations.

## Support and Resources

For more information, documentation, or support:

- **Official Website**: [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/)
- **Release Notes**: Check each release for detailed changelog and known issues
- **Documentation**: Comprehensive guides included with each release
- **FAQ & Help**: Available on the official ErgoSense website
- **Feedback**: Share your experience and suggestions to help improve ErgoSense

## Community & Feedback

As ErgoSense is in early access, your feedback is crucial to our development! If you encounter issues, have suggestions, or want to stay updated on platform releases, please reach out through the official website at [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/)

## About This Project

**ErgoSense** is built by a dedicated developer passionate about workplace wellness and ergonomic health. With cutting-edge AI and privacy-first design, I'm making ergonomic monitoring accessible to everyone who works at a computer.

**Key Philosophy**: Your privacy matters. Your data stays on your device. That's my promise.

---

## Quick Links

- 🌐 **Official Website**: [https://ergosense.sadish.com.np/](https://ergosense.sadish.com.np/)
- 📥 **Download Latest Release**: [See Releases](../../releases)
- 🆘 **Need Help?**: Visit the official website for support
- 💬 **Share Feedback**: Help us improve ErgoSense

---

**Last Updated**: November 26, 2025  
**Current Version**: v0.1.0 (Early Access)  
Copyright © 2025 ErgoSense. All rights reserved.
