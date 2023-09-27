const FILE_INPUT_ID = '#file_input';
const DROPZONE_SELECTOR = '.dropzone';
const ACTIVE_CLASS = 'bg-light';
const FORM_ID = '#form';
const EMAIL_FROM_ID = '#email_from';
const EMAIL_TO_ID = '#email_to';
const UPLOAD_PROGRESSBAR = '#upload_percentage';
const CONFIRMATION_MODAL_ID = '#confirmation-modal';

const VERIFICATION_CODE_INPUT_ID = '#verification_code_input';
const CANCEL_VERIFICATION_ID = '#cancel_verification_button';
const VERIFY_BUTTON_ID = '#verify_button';

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

const modal = document.querySelector(CONFIRMATION_MODAL_ID);
const verifyButton = document.querySelector(VERIFY_BUTTON_ID);
const cancelButton = document.querySelector(CANCEL_VERIFICATION_ID);
const codeInput = document.querySelector(VERIFICATION_CODE_INPUT_ID);

let selectedFile = undefined;
let keyForFile = undefined;
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

const showHideModal = (hide) => {
  const style = hide ? 'display:none' : 'display:block;background: #0000002e;';
  modal.setAttribute('style', style);
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
      data: { key },
    } = await submitReponse.json();
    keyForFile = key;
    console.log(keyForFile);
    showHideModal(false);
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

// MODAL EVENTS
cancelButton.addEventListener('click', () => {
  if (window.confirm('Are you sure you want to cancel sending file?'))
    window.location.reload();
});

verifyButton.addEventListener('click', async () => {
  const alert = document.querySelector('#verification_alert');
  const code = codeInput.value;
  if (!code) {
    alert.setAttribute('style', 'display:block');
  } else {
    alert.setAttribute('style', 'display:none');
  }
  verifyButton.setAttribute('innerText', 'Loading ...');

  try {
    const {
      data: { uploadURL, key },
    } = await (await sendRequest('verify', { code, key: keyForFile })).json();
    showHideModal(true);

    await uploadFileToUrl(uploadURL);

    const ackResponse = await sendRequest('ack', { key });
    if (ackResponse.redirected) {
      window.location.href = ackResponse.url;
    }
  } catch (e) {
    alert.setAttribute('style', 'display:block');
  }
});
