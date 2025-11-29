!macro customInit
  ; Check for Visual C++ 2015-2022 Redistributable (x64)
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  
  ${If} $0 != 1
    MessageBox MB_YESNO|MB_ICONEXCLAMATION "This application requires Microsoft Visual C++ Redistributable 2015-2022 (x64).$\n$\nIt appears to be missing from your system.$\n$\nWould you like to download it now?" IDYES download IDNO abort
    
    download:
      ExecShell "open" "https://aka.ms/vs/17/release/vc_redist.x64.exe"
      Abort "Installation cancelled. Please install Visual C++ Redistributable and try again."
      
    abort:
      Abort "Installation cancelled. Visual C++ Redistributable is required."
  ${EndIf}
!macroend
