const FILE_INPUT_ID = '#file_input';
const DROPZONE_SELECTOR = '.dropzone';
const ACTIVE_CLASS = 'bg-light';
const FORM_ID = '#form';
const EMAIL_FROM_ID = '#email_from';
const EMAIL_TO_ID = '#email_to';
const UPLOAD_PROGRESSBAR = '#upload_percentage';

const SIZE = 10;
const MAX_SIZE = SIZE * 1024 * 1024; // 10MB

const fileInput = document.querySelector(FILE_INPUT_ID);
const dropzone = document.querySelector(DROPZONE_SELECTOR);
const form = document.querySelector(FORM_ID);
const progressBarContainer = document.querySelector(UPLOAD_PROGRESSBAR);
const progressBar = document.querySelector(`${UPLOAD_PROGRESSBAR} div`);
const fromInput = document.querySelector(EMAIL_FROM_ID);
const toInput = document.querySelector(EMAIL_TO_ID);
const submitButton = document.querySelector('button[type="submit"]');
const messageBox = document.querySelector('#message-box');

let selectedFile = undefined;

const sendRequest = async (endpoint, body) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  try {
    const response = await fetch(`/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const resp = await response.json();
      throw new Error(JSON.stringify(resp));
    }

    return response;
  } catch (e) {
    throw e;
  }
};

const uploadFileToUrl = async (uploadURL) => {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    // Configure the XMLHttpRequest to track progress
    xhr.upload.addEventListener('loadstart', () => {
      progressBarContainer.setAttribute('style', 'visibility: visible;');
    });

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentage = (e.loaded / e.total) * 100;
        const twoDigits = percentage.toFixed(2);

        progressBar.setAttribute('style', `width:${twoDigits}%`);
        progressBar.innerHTML = `${twoDigits} %`;
      }
    });

    xhr.onreadystatechange = async () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          res('Successfully shared the file!');
        } else {
          rej(`File upload failed: ${xhr.statusText}`);
        }
      }
    };

    xhr.open('PUT', uploadURL, true);
    xhr.setRequestHeader('Content-Type', selectedFile.type);
    xhr.send(selectedFile);
  });
};

const showHideMessage = (show, message, isError = true) => {
  const boxCss = [`alert-${isError ? 'danger' : 'success'}`, 'custom-alert'];
  const msgCss = `text-${isError ? 'danger' : 'success'} p-2 b-3`;
  messageBox.classList = ''; //reset all first...
  messageBox.classList.add(...boxCss);
  messageBox.innerHTML = show ? `<p class="${msgCss}">${message}</p>` : null;
};

const fileValidation = (file) => {
  if (file.size > MAX_SIZE) {
    showHideMessage(true, `File size exceeds the ${SIZE} MB limit.`);
    return;
  }
  showHideMessage(false, '', true);
  dropzone.querySelector('p').innerHTML = file.name;
  selectedFile = file; //This is the file that we'd want to send metadata of...
};

//#region FORM EVENTS
const checkFormValidity = () => {
  const isFormValid = () =>
    toInput.validity.valid &&
    fromInput.validity.valid &&
    fileInput.validity.valid;

  submitButton.disabled = !isFormValid();
};

fromInput.addEventListener('change', checkFormValidity);
toInput.addEventListener('change', checkFormValidity);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const { name, type, size } = selectedFile;
  const fileMetadata = { name, type, size };
  try {
    submitButton.disabled = true;
    const submitReponse = await sendRequest('submit', {
      from: fromInput.value,
      to: toInput.value,
      fileMetadata,
    });

    const {
      data: { uploadURL, key },
    } = await submitReponse.json();

    await uploadFileToUrl(uploadURL);

    const ackResponse = await sendRequest('ack', { key });
    if (ackResponse.redirected) {
      window.location.href = ackResponse.url;
    }
  } catch (e) {
    const {
      data: { cause },
    } = JSON.parse(e.message);
    showHideMessage(true, cause);
    submitButton.disabled = false;
  }
});
//#endregion

//#region FILE DRAG DROP EVENTS...
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add(ACTIVE_CLASS);
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove(ACTIVE_CLASS);
});

dropzone.addEventListener('drop', (event) => {
  dropzone.classList.remove(ACTIVE_CLASS);

  event.preventDefault();
  const fileToUpload = event.dataTransfer.files[0];
  fileValidation(fileToUpload);
});

dropzone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', ({ target }) => {
  const selectedFile = target.files[0];
  if (selectedFile) {
    fileValidation(selectedFile);
    checkFormValidity();
  }
});
//#endregion
