cmake_minimum_required(VERSION 3.21)
project(PRISMA3DEngineer VERSION 0.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 6.8 REQUIRED COMPONENTS Quick Quick3D QuickControls2)

qt_standard_project_setup(REQUIRES 6.8)

qt_add_executable(prisma3d
    src/main.cpp
)

qt_add_qml_module(prisma3d
    URI Prisma3D
    VERSION 1.0
    QML_FILES
        qml/Main.qml
)

set_target_properties(prisma3d PROPERTIES
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
    QT_ANDROID_PACKAGE_NAME "com.prisma3d.engineer"
    QT_ANDROID_APP_NAME "PRISMA 3D Engineer"
)

target_link_libraries(prisma3d PRIVATE
    Qt6::Quick
    Qt6::Quick3D
    Qt6::QuickControls2
)

install(TARGETS prisma3d
    BUNDLE DESTINATION .
    RUNTIME DESTINATION bin
)
