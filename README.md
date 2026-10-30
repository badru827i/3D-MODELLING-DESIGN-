# PRISMA 3D Engineer

PRISMA 3D Engineer is being rebuilt as a **native C++/Qt application** for Android and Windows. The native application does not use a website, PWA, browser view, Vite, Three.js, or Capacitor.

## Native technology
- C++17 and Qt 6 / Qt Quick Controls for the application UI.
- Qt Quick 3D for the real-time 3D viewport.
- Qt's supported Android graphics backend and device drivers target Qualcomm Adreno and MediaTek Mali GPUs; actual Vulkan/OpenGL ES support depends on each device and driver.
- Geometry coordinates are stored in millimetres; display units are mm, cm, m and inch.
- Android package target: arm64-v8a.
- Windows desktop target: x64.

## Native source
The application source is in `native/`. The old Vite/Three.js prototype remains temporarily as a reference only and is not part of the native app or its APK.

## Current native milestone
- Native Qt application entry point.
- Qt Quick 3D viewport with cube, sphere, cylinder and cone selection.
- Dimension controls and display units: mm, cm, m and inch.
- Android arm64 and Windows x64 CI build definitions.

## Next engineering milestones
- Verify native Android APK build and install on physical devices.
- Project save/open and undo/redo.
- Transform gizmos and viewport navigation.
- Vertex, edge and face editing; extrude, inset and bevel.
- Accurate mesh analysis, edge angles, area and volume.
- Robust CAD kernel integration for Boolean operations, fillets, chamfers and STEP.
- Native Windows installer and signed Android release APK.

## Engineering note
This is an early native 3D modeling foundation, not yet a full parametric CAD system or a certified manufacturing tool. Mesh volume and manufacturing tolerances require validation before fabrication.
