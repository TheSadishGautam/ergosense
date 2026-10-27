; Microsoft VC++ 2015-2022 runtime is required by onnxruntime-node.
; CI downloads vc_redist.x64.exe into build/ before packaging; local builds without it
; fall back to a non-blocking prompt instead of aborting the install.

!macro checkVcRedist
  ; The redist registers in the 64-bit view; older installs may only be in the 32-bit view.
  SetRegView 64
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  SetRegView 32
  ${If} $0 != 1
    ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" "Installed"
  ${EndIf}
  SetRegView lastused
!macroend

!macro customInstall
  !insertmacro checkVcRedist
  ${If} $0 != 1
    !if /FileExists "${BUILD_RESOURCES_DIR}\vc_redist.x64.exe"
      DetailPrint "Installing Microsoft Visual C++ Redistributable..."
      File "/oname=$PLUGINSDIR\vc_redist.x64.exe" "${BUILD_RESOURCES_DIR}\vc_redist.x64.exe"
      ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /install /quiet /norestart' $1
      ; 0 = success, 1638 = newer version already installed, 3010 = success, reboot required
      ${If} $1 != 0
      ${AndIf} $1 != 1638
      ${AndIf} $1 != 3010
        DetailPrint "VC++ Redistributable installer exited with code $1"
      ${EndIf}
    !else
      ${IfNot} ${Silent}
        MessageBox MB_YESNO|MB_ICONINFORMATION "ErgoSense needs the Microsoft Visual C++ Redistributable 2015-2022 (x64), which was not found.$\n$\nOpen the download page now? Installation will continue either way." /SD IDNO IDNO skipVcRedist
        ExecShell "open" "https://aka.ms/vs/17/release/vc_redist.x64.exe"
        skipVcRedist:
      ${EndIf}
    !endif
  ${EndIf}
!macroend
