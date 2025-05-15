import { Component, inject }    from '@angular/core';
import { Injectable }   from '@angular/core';
import { Title }        from '@angular/platform-browser';

@Injectable()
export class TitleManagerService {
    private titleService = inject(Title);


    setTitle(newTitle: string) {
        this.titleService.setTitle(newTitle);
    }

    getTitle(): string {
        return this.titleService.getTitle();
    }

}
