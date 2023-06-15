

const imageUpload = document.getElementById('imageUpload')
let imageURL="";


Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(start)

async function start() {
    const container = document.createElement('div')
    container.style.position = 'relative'
    document.body.append(container)
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    let image
    let canvas
    document.body.append('Loaded')
    imageUpload.addEventListener('change', async () => {
        if (image) image.remove()
        if (canvas) canvas.remove()
        image = await faceapi.bufferToImage(imageUpload.files[0])
        container.append(image)
        canvas = faceapi.createCanvasFromMedia(image)
        container.append(canvas)
        const displaySize = { width: image.width, height: image.height }
        faceapi.matchDimensions(canvas, displaySize)
        const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
        console.log(detections);
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
        console.log(results);
        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
            drawBox.draw(canvas)
            if (result.toString() === 'Inbar') {
                alert('inbar is found!')
            }
        })
    })
}

function loadLabeledImages() {
    const labels = ['Darya','Inbar'];
    uploadFile("C:\\Users\\User\\WebstormProjects\\-Face-Recognitios\\labeled_images\\Inbar\\1.jpeg");
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`downloadURL/${label}/${i}.jpg`)
                print({label})
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
                print(detections)
            }

            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

function uploadFile(file) {
    // Create a storage reference with a unique filename
    const storageRef = storage.ref().child('images/' + file.name);

    // Upload the file
    const uploadTask = storageRef.put(file);

    // Listen for upload completion
    uploadTask.on('state_changed',
        function(snapshot) {
            // Track upload progress if needed
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload progress: ' + progress + '%');
        },
        function(error) {
            // Handle upload error
            console.error('Upload error:', error);
        },
        function() {
            // Handle upload success
            console.log('Upload successful!');

            // Get the download URL of the uploaded file
            uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
                console.log('File available at:', downloadURL);
                imageURL= downloadURL;
            });
        }
    );
}
