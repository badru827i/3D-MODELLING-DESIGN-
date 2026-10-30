import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick3D

ApplicationWindow {
    id: window
    width: 1280
    height: 800
    visible: true
    title: "PRISMA 3D Engineer"
    color: "#0d1220"

    property string activeUnit: "mm"
    property real objectWidth: 100
    property real objectHeight: 100
    property real objectDepth: 100
    property string selectedPrimitive: "Cube"

    function unitScale() {
        if (activeUnit === "cm") return 0.1
        if (activeUnit === "m") return 0.001
        if (activeUnit === "inch") return 0.0393700787
        return 1
    }
    function displayValue(mm) { return (mm * unitScale()).toFixed(2) }

    header: ToolBar {
        background: Rectangle { color: "#141d31"; border.color: "#273957" }
        RowLayout {
            anchors.fill: parent
            anchors.leftMargin: 16
            anchors.rightMargin: 16
            Label { text: "PRISMA"; color: "#8eb7ff"; font.pixelSize: 21; font.bold: true }
            Label { text: "3D ENGINEER"; color: "#e8efff"; font.pixelSize: 15; font.bold: true }
            Item { Layout.fillWidth: true }
            Label { text: "NATIVE 3D • GPU VIEWPORT"; color: "#91a6c7"; font.pixelSize: 11 }
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: 12
        spacing: 12

        Rectangle {
            Layout.preferredWidth: 220
            Layout.fillHeight: true
            radius: 12
            color: "#151f33"
            border.color: "#293a58"
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 14
                Label { text: "CREATE OBJECT"; color: "#9db8e8"; font.bold: true }
                Repeater {
                    model: ["Cube", "Sphere", "Cylinder", "Cone"]
                    delegate: Button {
                        Layout.fillWidth: true
                        text: modelData
                        highlighted: window.selectedPrimitive === modelData
                        onClicked: {
                            window.selectedPrimitive = modelData
                            if (modelData === "Cube") { objectWidth = 100; objectHeight = 100; objectDepth = 100 }
                            else if (modelData === "Sphere") { objectWidth = 100; objectHeight = 100; objectDepth = 100 }
                            else { objectWidth = 80; objectHeight = 120; objectDepth = 80 }
                        }
                    }
                }
                Item { Layout.fillHeight: true }
                Label { text: "PROJECT"; color: "#9db8e8"; font.bold: true }
                Label { text: "Local project workspace"; color: "#91a0ba"; wrapMode: Text.WordWrap }
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            radius: 12
            color: "#0a1020"
            border.color: "#293a58"
            View3D {
                anchors.fill: parent
                anchors.margins: 1
                environment: SceneEnvironment {
                    backgroundMode: SceneEnvironment.Color
                    clearColor: "#0a1020"
                    antialiasingMode: SceneEnvironment.MSAA
                    antialiasingQuality: SceneEnvironment.High
                }
                Node {
                    id: cameraRig
                    PerspectiveCamera {
                        position: Qt.vector3d(260, 220, 340)
                        eulerRotation: Qt.vector3d(-25, 38, 0)
                        clipFar: 10000
                    }
                }
                DirectionalLight {
                    eulerRotation: Qt.vector3d(-35, -35, 0)
                    brightness: 1.4
                }
                DirectionalLight {
                    eulerRotation: Qt.vector3d(25, 145, 0)
                    brightness: 0.55
                }
                Model {
                    id: mainModel
                    source: window.selectedPrimitive === "Sphere" ? "#Sphere"
                          : window.selectedPrimitive === "Cylinder" ? "#Cylinder"
                          : window.selectedPrimitive === "Cone" ? "#Cone" : "#Cube"
                    scale: Qt.vector3d(window.objectWidth / 100,
                                       window.objectHeight / 100,
                                       window.objectDepth / 100)
                    materials: PrincipledMaterial {
                        baseColor: "#4c8dff"
                        metalness: 0.22
                        roughness: 0.28
                    }
                }
                Model {
                    source: "#Cube"
                    y: -65
                    scale: Qt.vector3d(4, 0.02, 4)
                    materials: PrincipledMaterial { baseColor: "#263650"; roughness: 0.9 }
                }
            }
            Rectangle {
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.margins: 14
                radius: 8
                color: "#b8141f33"
                border.color: "#38527a"
                padding: 10
                Label { text: "3D VIEWPORT  |  " + window.selectedPrimitive; color: "#cfe0ff" }
            }
        }

        Rectangle {
            Layout.preferredWidth: 260
            Layout.fillHeight: true
            radius: 12
            color: "#151f33"
            border.color: "#293a58"
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 14
                spacing: 10
                Label { text: "ENGINEERING"; color: "#9db8e8"; font.bold: true }
                Label { text: "Units"; color: "#c6d4ed" }
                ComboBox {
                    Layout.fillWidth: true
                    model: ["mm", "cm", "m", "inch"]
                    currentIndex: 0
                    onActivated: window.activeUnit = currentText
                }
                Label { text: "Dimensions (" + window.activeUnit + ")"; color: "#c6d4ed"; font.bold: true }
                Label { text: "Width"; color: "#91a0ba" }
                SpinBox {
                    Layout.fillWidth: true
                    from: 1; to: 1000000; value: 100
                    onValueModified: window.objectWidth = value / window.unitScale()
                }
                Label { text: "Height"; color: "#91a0ba" }
                SpinBox {
                    Layout.fillWidth: true
                    from: 1; to: 1000000; value: 100
                    onValueModified: window.objectHeight = value / window.unitScale()
                }
                Label { text: "Depth"; color: "#91a0ba" }
                SpinBox {
                    Layout.fillWidth: true
                    from: 1; to: 1000000; value: 100
                    onValueModified: window.objectDepth = value / window.unitScale()
                }
                Rectangle { Layout.fillWidth: true; height: 1; color: "#293a58" }
                Label { text: "LIVE MEASUREMENTS"; color: "#9db8e8"; font.bold: true }
                Label { text: "W  " + window.displayValue(window.objectWidth) + " " + window.activeUnit; color: "#e2ecff" }
                Label { text: "H  " + window.displayValue(window.objectHeight) + " " + window.activeUnit; color: "#e2ecff" }
                Label { text: "D  " + window.displayValue(window.objectDepth) + " " + window.activeUnit; color: "#e2ecff" }
                Item { Layout.fillHeight: true }
                Label {
                    text: "Native Qt Quick 3D preview. CAD editing tools are being built in stages."
                    color: "#91a0ba"
                    wrapMode: Text.WordWrap
                    Layout.fillWidth: true
                }
            }
        }
    }
}
